import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { StorageService } from '../../libs/storage/storage.service';
import type { User } from '../../../../prisma/generated/prisma/client';
import { CreateAlbumInput } from './inputs/create-album.input';
import { UpdateAlbumInput } from './inputs/update-album.input';
import { FilterAlbumInput } from './inputs/filter-albums.input';
import { UploadedFile } from '../../../shared/types/uploadedFile.types';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

@Injectable()
export class AlbumService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createAlbum(user: User, input: CreateAlbumInput) {
    const { title, isPublic, thumbnailUrl } = input;

    const isExists = await this.prismaService.album.findUnique({
      where: { title },
    });

    if (isExists) {
      throw new ConflictException('Альбом с таким названием уже существует');
    }

    const album = await this.prismaService.album.create({
      data: {
        title,
        thumbnailUrl: thumbnailUrl || '',
        isPublic: isPublic ?? true,
        userId: user.id,
      },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    return { ...album, projectCount: album._count.projects };
  }

  async updateAlbum(user: User, input: UpdateAlbumInput) {
    const { isPublic, title, id, thumbnailUrl } = input;

    const album = await this.prismaService.album.findUnique({
      where: {
        id,
      },
    });

    if (!album) {
      throw new NotFoundException('Альбом не найден');
    }

    if (album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому альбому');
    }

    if (title && title !== album.title) {
      const isExists = await this.prismaService.album.findUnique({
        where: { title },
      });

      if (isExists) {
        throw new ConflictException('Альбом с таким названием уже существует');
      }
    }

    const updated = await this.prismaService.album.update({
      where: { id },
      data: {
        title,
        isPublic,
        thumbnailUrl: thumbnailUrl ? thumbnailUrl : undefined,
      },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (isPublic !== undefined) {
      await this.prismaService.project.updateMany({
        where: { albumId: id },
        data: { isPublic },
      });
    }

    return { ...updated, projectCount: updated._count.projects };
  }

  async removeAlbum(user: User, id: string) {
    const album = await this.prismaService.album.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            media: true,
          },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Альбом не найден');
    }

    if (album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому альбому');
    }

    for (const project of album.projects) {
      for (const media of project.media) {
        await this.storageService.remove(media.url);
      }
    }

    if (album.thumbnailUrl) {
      await this.storageService.remove(album.thumbnailUrl);
    }

    await this.prismaService.album.delete({
      where: { id },
    });

    return true;
  }

  async findAllAlbums(filter: FilterAlbumInput) {
    const { limit = 10, page = 1, publicOnly, search } = filter;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }];
    }

    if (publicOnly) {
      where.isPublic = true;
    }

    const [albums, total] = await Promise.all([
      await this.prismaService.album.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
          user: {
            select: {
              id: true,
              avatar: true,
              username: true,
            },
          },
        },
      }),
      await this.prismaService.album.count({ where }),
    ]);

    return {
      data: albums.map(album => ({
        ...album,
        projectCount: album._count.projects,
      })),
      meta: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(user: User, id: string) {
    const album = await this.prismaService.album.findUnique({
      where: { id },
      include: {
        _count: { select: { projects: true } },
        user: { select: { id: true, avatar: true, username: true } },
        projects: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            media: { take: 1 },
            _count: { select: { comment: true, projectLikes: true } },
          },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Альбом не найден');
    }

    if (!album.isPublic && album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому альбому');
    }

    const projects = album.projects.map(p => ({
      ...p,
      likes: p._count.projectLikes,
      commentsCount: p._count.comment,
    }));

    return { ...album, projectCount: album._count.projects, projects };
  }

  async uploadImage(file: UploadedFile) {
    const albumId = randomUUID();
    let thumbnailUrl = '';

    if (file) {
      const fileName = `albums/${albumId}/thumbnail.webp`;

      const precessedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'cover' })
        .webp()
        .toBuffer();

      await this.storageService.upload(precessedBuffer, fileName, 'image/webp');

      thumbnailUrl = fileName;
    }

    return { thumbnailUrl };
  }

  async removeImage(user: User, albumId: string) {
    const album = await this.prismaService.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Альбом не найден');
    }

    if (album.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому альбому');
    }

    if (!album.thumbnailUrl) {
      return true;
    }

    await this.storageService.remove(album.thumbnailUrl);

    await this.prismaService.album.update({
      where: { id: albumId },
      data: { thumbnailUrl: '' },
    });

    return true;
  }
}
