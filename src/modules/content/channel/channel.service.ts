import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import type { User } from '../../../../prisma/generated/prisma/client';
import { FindFollowers } from './inputs/find-followers.input';
import { FindFollowings } from './inputs/find-followings.input';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ChannelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

  async getChannel(username: string, currentUserId?: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
      include: {
        socialLink: { orderBy: { position: 'asc' } },
        albums: {
          where: { isPublic: true },
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { projects: true } } },
        },
        _count: {
          select: { followers: true, followings: true, albums: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isOwner = currentUserId === user.id;

    // Owners see all their albums (including private); others see only public
    const channelAlbums = isOwner
      ? await this.prismaService.album.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { projects: true } } },
        })
      : user.albums;

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await this.prismaService.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    const albumFilter = isOwner
      ? { userId: user.id }
      : { userId: user.id, isPublic: true };

    const projectWhere = {
      album: albumFilter,
      title: { not: null },
      ...(isOwner ? {} : { isPublic: true }),
    };

    const projects = await this.prismaService.project.findMany({
      where: projectWhere,
      take: 6,
      orderBy: { createdAt: 'asc' },
      include: {
        media: {
          ...(isOwner ? {} : { where: { mediaType: 'IMAGE' }, take: 1 }),
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { comment: true, projectLikes: true } },
      },
    });
    const projectsCount = await this.prismaService.project.count({
      where: projectWhere,
    });

    const stats = await this.prismaService.project.aggregate({
      where: projectWhere,
      _sum: { likes: true, views: true },
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      isFollowing,
      stats: {
        followersCount: user._count.followers,
        followingCount: user._count.followings,
        albumsCount: user._count.albums,
        projectsCount,
        totalLikes: stats._sum.likes || 0,
        totalViews: stats._sum.views || 0,
      },
      socialLinks: user.socialLink,
      albums: channelAlbums.map(album => ({
        ...album,
        projectsCount: album._count.projects,
      })),
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        isPublic: project.isPublic,
        tags: project.tags,
        thumbnailUrl:
          project.media.find(m => m.mediaType === 'IMAGE')?.url || '',
        media: project.media.map(m => ({
          id: m.id,
          url: m.url,
          mediaType: m.mediaType,
        })),
        likes: project._count.projectLikes,
        views: project.views,
        commentsCount: project._count.comment,
      })),
      createdAt: user.createdAt,
    };
  }

  async follow(user: User, channelId: string) {
    const channel = await this.prismaService.user.findUnique({
      where: {
        id: channelId,
      },
    });

    if (!channel) {
      throw new NotFoundException('Канал не найден');
    }

    if (channel.id === user.id) {
      throw new ConflictException('Нельзя подписаться на себя');
    }

    const existingFollow = await this.prismaService.follow.findFirst({
      where: {
        followerId: user.id,
        followingId: channel.id,
      },
    });

    if (existingFollow) {
      // already following — idempotent
      return true;
    }

    await this.prismaService.follow.create({
      data: {
        followerId: user.id,
        followingId: channel.id,
      },
    });

    await this.notificationService.notifyNewFollower(user.id, channel.id);

    return true;
  }

  async unfollow(user: User, channelId: string) {
    const channel = await this.prismaService.user.findUnique({
      where: {
        id: channelId,
      },
    });

    if (!channel) {
      throw new NotFoundException('Канал не найден');
    }

    if (channel.id === user.id) {
      throw new ConflictException('Нельзя подписаться на себя');
    }

    const existingFollow = await this.prismaService.follow.findFirst({
      where: {
        followerId: user.id,
        followingId: channel.id,
      },
    });

    if (!existingFollow) {
      // not following — idempotent
      return true;
    }

    await this.prismaService.follow.delete({
      where: { id: existingFollow.id },
    });

    return true;
  }

  async findMyFollowers(input: FindFollowers) {
    const { username, limit = 20, page = 1 } = input;

    const skip = (page - 1) * limit;

    const user = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const [followers, total] = await Promise.all([
      await this.prismaService.follow.findMany({
        where: {
          followingId: user.id,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
            },
          },
        },
      }),
      await this.prismaService.follow.count({
        where: { followingId: user.id },
      }),
    ]);

    return {
      data: followers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyFollowings(input: FindFollowings) {
    const { username, limit = 20, page = 1 } = input;

    const skip = (page - 1) * limit;

    const user = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const [followings, total] = await Promise.all([
      await this.prismaService.follow.findMany({
        where: {
          followerId: user.id,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
            },
          },
        },
      }),
      await this.prismaService.follow.count({
        where: { followerId: user.id },
      }),
    ]);

    return {
      data: followings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
