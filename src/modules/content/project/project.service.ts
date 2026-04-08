import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { StorageService } from '../../libs/storage/storage.service';
import {
  MediaType,
  type User,
} from '../../../../prisma/generated/prisma/client';
import type { UploadedFile } from '../../../shared/types/uploadedFile.types';
import sharp from 'sharp';
import { CreateProjectInput } from './inputs/create-project.input';
import { UpdateProjectInput } from './inputs/update-project.input';
import { FilterProjectInput } from './inputs/filter-project.input';
import { CreateTagInput } from './inputs/add-tag.input';
import { RemoveTagInput } from './inputs/remove-tag.input';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ProjectService {
  private readonly MAX_IMAGES = 10;
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024;
  private readonly TAG_REGEX = /^[a-zA-Z0-9-_]+$/;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationsService,
  ) {}

  private validateTags(tags: string[]) {
    let validatedTags: string[] = [];

    for (const tag of tags) {
      const normalized = tag.toLowerCase().trim();
      if (!normalized) continue;

      if (!this.TAG_REGEX.test(normalized)) {
        throw new BadRequestException(
          `Тег ${tag} содержит недопустимые символы`,
        );
      }

      if (normalized.length > 30) {
        throw new BadRequestException(
          'Длина тега не должна привышать 30 символов',
        );
      }

      if (!validatedTags.includes(normalized)) {
        validatedTags.push(normalized);
      }

      if (validatedTags.length > 10) {
        throw new BadRequestException('Максимум 10 тегов');
      }
    }

    return validatedTags;
  }

  async createDraftProject(user: User, albumId: string) {
    const album = await this.prismaService.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Альбом не найден');
    }

    if (album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому проекту');
    }

    const draft = await this.prismaService.project.create({
      data: { albumId, status: 'DRAFT', isPublic: false },
    });

    return draft.id;
  }

  async createProject(user: User, input: CreateProjectInput) {
    const { projectId, title, description, isPublic, tags } = input;

    const validatedTags = tags ? this.validateTags(tags) : [];

    const project = await this.prismaService.project.findUnique({
      where: { id: projectId, status: 'DRAFT' },
      include: { album: { select: { userId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому проекту');
    }

    const saveProject = await this.prismaService.project.update({
      where: {
        id: projectId,
      },
      data: {
        title,
        description,
        id: projectId,
        tags: validatedTags,
        isPublic: isPublic ?? true,
        status: 'PUBLISHED',
      },
      include: {
        media: true,
        _count: { select: { comment: true, projectLikes: true } },
      },
    });

    await this.notificationService.notifyNewProject(
      user.id,
      project.id,
      saveProject.title,
    );

    return {
      ...saveProject,
      isLiked: false,
      likes: saveProject._count.projectLikes,
      commentsCount: saveProject._count.comment,
    };
  }

  async updateProject(user: User, input: UpdateProjectInput) {
    const { projectId, description, isPublic, tags, title } = input;

    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
      include: { album: { select: { userId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.album.userId !== user.id) {
      throw new ForbiddenException('У вас не доступа к этому альбому');
    }

    if (title && project.title !== title) {
      const exists = await this.prismaService.project.findFirst({
        where: { title, albumId: project.albumId, NOT: { id: projectId } },
      });

      if (exists) {
        throw new ConflictException('Проект с таким названием уже существует');
      }
    }

    const updatedTags = tags ? this.validateTags(tags) : undefined;

    const updated = await this.prismaService.project.update({
      where: { id: projectId },
      data: {
        title: title ?? undefined,
        isPublic: isPublic ?? undefined,
        tags: updatedTags,
        description: description ?? undefined,
      },
      include: {
        media: true,
        _count: {
          select: {
            comment: true,
            projectLikes: true,
          },
        },
      },
    });

    return {
      ...updated,
      likes: updated._count.projectLikes,
      commentsCount: updated._count.comment,
    };
  }

  async removeProject(user: User, projectId: string) {
    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
      include: { media: true, album: { select: { userId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.album.userId !== user.id) {
      throw new ForbiddenException('У вас не доступа к этому альбому');
    }

    for (const media of project.media) {
      await this.storageService.remove(media.url);
    }

    await this.prismaService.project.delete({
      where: { id: projectId },
    });

    return true;
  }

  async removeDraftProject(user: User, projectId: string) {
    const project = await this.prismaService.project.findFirst({
      where: { id: projectId, status: 'DRAFT' },
      include: { media: true, album: { select: { userId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Черновик не найден');
    }

    if (project.album.userId !== user.id) {
      throw new ForbiddenException('У вас не доступа к этому проекту');
    }

    for (const media of project.media) {
      await this.storageService.remove(media.url);
    }

    await this.prismaService.project.delete({ where: { id: projectId } });

    return true;
  }

  async uploadImages(user: User, projectId: string, images: UploadedFile[]) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        album: { select: { userId: true } },
        media: { where: { mediaType: MediaType.IMAGE } },
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому проекту');
    }

    const currentImagesLength = project.media.length;
    const newImagesLength = images.length;

    if (currentImagesLength + newImagesLength > this.MAX_IMAGES) {
      throw new BadRequestException(
        `Максиум ${this.MAX_IMAGES} изображений. У вас уже ${currentImagesLength}`,
      );
    }

    const uploadPromises = images.map(async (image, index) => {
      if (image.size > this.MAX_IMAGE_SIZE) {
        throw new BadRequestException(
          `Изображение ${index + 1} слишком большое (макс 10МБ)`,
        );
      }

      const fileName = `projects/${projectId}/image-${Date.now()}-${index}.webp`;

      const processedBuffer = await sharp(image.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      await this.storageService.upload(processedBuffer, fileName, 'image/webp');

      return { url: fileName, mediaType: MediaType.IMAGE, projectId };
    });

    const mediaData = await Promise.all(uploadPromises);

    await this.prismaService.media.createMany({
      data: mediaData,
    });

    const media = {
      uploaded: images.length,
      total: currentImagesLength + newImagesLength,
      images: mediaData.map(m => ({
        url: m.url,
        mediaType: m.mediaType,
        projectId: m.projectId,
      })),
    };

    return media;
  }

  async uploadVideo(user: User, projectId: string, video: UploadedFile) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        album: { select: { userId: true } },
        media: { where: { mediaType: MediaType.VIDEO } },
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому проекту');
    }

    if (project.media.length >= 1) {
      throw new BadRequestException(
        'В проекте уже есть видео. Удалите старое перед загрузкой нового',
      );
    }

    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(video.mimetype)) {
      throw new BadRequestException('Неподдерживаемый формат видео');
    }
    if (video.size > this.MAX_VIDEO_SIZE) {
      throw new BadRequestException('Видео слишком большое (макс 100MB)');
    }

    const fileName = `projects/${projectId}/video-${Date.now()}.mp4`;

    await this.storageService.upload(video.buffer, fileName, video.mimetype);

    const media = await this.prismaService.media.create({
      data: {
        url: fileName,
        mediaType: MediaType.VIDEO,
        projectId,
      },
    });

    return media;
  }

  async removeMedia(user: User, mediaId: string) {
    const media = await this.prismaService.media.findUnique({
      where: {
        id: mediaId,
      },
      include: {
        project: {
          include: {
            album: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Медиа не найдено');
    }

    if (media.project.album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому медиа');
    }

    await this.storageService.remove(media.url);

    await this.prismaService.media.delete({
      where: {
        id: mediaId,
      },
    });

    return true;
  }

  async findOne(id: string, userId?: string) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
      },
      include: {
        media: { orderBy: { createdAt: 'asc' } },

        comment: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        album: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },

        _count: {
          select: { comment: true, projectLikes: true },
        },
        projectLikes: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    const author = project.album.user;

    let followersCount = 0;
    let isFollowing = false;

    if (author) {
      const [count, follow] = await Promise.all([
        this.prismaService.follow.count({ where: { followingId: author.id } }),
        userId
          ? this.prismaService.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: userId,
                  followingId: author.id,
                },
              },
            })
          : Promise.resolve(null),
      ]);

      followersCount = count;
      isFollowing = !!follow;
    }

    return {
      ...project,
      comments: project.comment,
      likes: project._count.projectLikes,
      commentsCount: project._count.comment,
      isLiked: userId
        ? project.projectLikes.some(
            projectLike => projectLike.userId === userId,
          )
        : false,
      likedBy: project.projectLikes,
      album: {
        ...project.album,
        user: {
          ...author,
          followers: followersCount,
          isFollowing,
        },
      },
    };
  }

  async incrementView(id: string) {
    const updated = await this.prismaService.project.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    return updated.views;
  }

  async findAll(filter: FilterProjectInput, userId?: string) {
    const { limit = 10, page = 1, publicOnly, search, tags } = filter;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags.map(tag => tag.toLowerCase()),
      };
    }

    if (publicOnly) {
      where.isPublic = true;
    }

    const [projects, total] = await Promise.all([
      await this.prismaService.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          media: {
            orderBy: { createdAt: 'asc' },
          },
          album: {
            select: {
              user: {
                select: {
                  id: true,
                  avatar: true,
                  username: true,
                },
              },
            },
          },
          _count: { select: { comment: true, projectLikes: true } },
          projectLikes: userId
            ? { where: { userId }, select: { id: true } }
            : false,
        },
        orderBy: { createdAt: 'desc' },
      }),
      await this.prismaService.project.count({ where }),
    ]);

    return {
      data: projects.map(project => ({
        ...project,
        commentsCount: project._count.comment,
        likes: project._count.projectLikes,
        isLiked: userId ? project.projectLikes.length > 0 : false,
      })),
      meta: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async toggleLike(user: User, projectId: string) {
    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    const existingLike = await this.prismaService.projectLike.findUnique({
      where: { userId_projectId: { projectId, userId: user.id } },
    });

    let isLiked = false;

    if (existingLike) {
      await this.prismaService.projectLike.delete({
        where: { id: existingLike.id },
      });

      await this.prismaService.project.update({
        where: { id: projectId },
        data: { likes: Math.max(0, project.likes - 1) },
      });
    } else {
      await this.prismaService.projectLike.create({
        data: {
          projectId,
          userId: user.id,
        },
      });
      await this.prismaService.project.update({
        where: { id: projectId },
        data: { likes: project.likes + 1 },
      });
      isLiked = true;

      await this.notificationService.notifyProjectLike(user.id, project.id);
    }

    const updatedProject = await this.prismaService.project.findUnique({
      where: { id: projectId },
      include: {
        media: true,
        _count: { select: { projectLikes: true, comment: true } },
        projectLikes: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return {
      ...updatedProject,
      likes: updatedProject.likes,
      commentsCount: updatedProject._count.comment,
      isLiked: updatedProject.projectLikes.some(
        projectLike => projectLike.userId === user.id,
      ),
      likedBy: updatedProject.projectLikes,
    };
  }

  async getLikes(projectId: string) {
    const likes = await this.prismaService.projectLike.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return likes.map(l => ({ id: l.id, createdAt: l.createdAt, user: l.user }));
  }

  async setLike(user: User, projectId: string, like: boolean) {
    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    const existingLike = await this.prismaService.projectLike.findUnique({
      where: { userId_projectId: { projectId, userId: user.id } },
    });

    if (like) {
      if (!existingLike) {
        await this.prismaService.projectLike.create({
          data: { projectId, userId: user.id },
        });
        await this.prismaService.project.update({
          where: { id: projectId },
          data: { likes: project.likes + 1 },
        });
      }
    } else {
      if (existingLike) {
        await this.prismaService.projectLike.delete({
          where: { id: existingLike.id },
        });
        await this.prismaService.project.update({
          where: { id: projectId },
          data: { likes: Math.max(0, project.likes - 1) },
        });
      }
    }

    const updated = await this.prismaService.project.findUnique({
      where: { id: projectId },
      include: {
        _count: { select: { projectLikes: true, comment: true } },
        projectLikes: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return {
      ...updated,
      likes: updated.likes,
      commentsCount: updated._count.comment,
      isLiked: !!(await this.prismaService.projectLike.findUnique({
        where: { userId_projectId: { projectId, userId: user.id } },
      })),
      likedBy: updated.projectLikes,
    };
  }

  async addTag(user: User, input: CreateTagInput) {
    const { projectId, tag } = input;

    const project = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
      include: { album: { select: { userId: true } } },
    });

    if (!project) {
      throw new NotFoundException('Альбом не найден');
    }

    if (user.id !== project.album.userId) {
      throw new ForbiddenException('У вас нет доступа к этому альбому');
    }

    if (project.tags.length >= 10) {
      throw new BadRequestException('Максимум 10 тегов');
    }

    const normalizedTag = tag.toLowerCase().trim();
    this.validateTags([normalizedTag]);

    if (project.tags.includes(normalizedTag)) {
      throw new ConflictException('Этот тег уже добавлен');
    }

    await this.prismaService.project.update({
      where: {
        id: project.id,
      },
      data: {
        tags: [...project.tags, normalizedTag],
      },
      include: {
        media: true,
        _count: {
          select: { comment: true, projectLikes: true },
        },
      },
    });

    return true;
  }

  async removeTag(user: User, input: RemoveTagInput) {
    const { projectId, tag } = input;

    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
      include: {
        album: {
          select: { userId: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Альбом не найден');
    }

    if (user.id !== project.album.userId) {
      throw new ForbiddenException('У вас нет доступа к этому альбому');
    }

    const normalizedTag = tag.toLowerCase().trim();

    if (!project.tags.includes(normalizedTag)) {
      throw new ConflictException('Тег не найден в альбоме');
    }

    await this.prismaService.project.update({
      where: { id: projectId },
      data: {
        tags: project.tags.filter(t => t !== normalizedTag),
      },
      include: {
        media: true,
        _count: {
          select: {
            comment: true,
            projectLikes: true,
          },
        },
      },
    });

    return true;
  }

  async popularTags(limit = 5) {
    const projects = await this.prismaService.project.findMany({
      where: { isPublic: true },
      select: { tags: true },
    });

    const tagCount = new Map<string, number>();

    for (const project of projects) {
      for (const tag of project.tags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }

    const sortedTags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
  }
}
