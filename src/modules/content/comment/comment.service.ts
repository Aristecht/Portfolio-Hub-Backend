import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import type { User } from '../../../../prisma/generated/prisma/client';
import { CreateCommentInput } from './inputs/create-comment.input';
import { FilterCommentInput } from './inputs/filter-comment.input';
import { GetRepliesInput } from './inputs/get-replies.input';
import { UpdateCommentInput } from './inputs/update-comment.input';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

  async create(user: User, input: CreateCommentInput) {
    const { text, projectId, parentId } = input;

    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (parentId) {
      const parentComment = await this.prismaService.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Родительский комментарий не найден');
      }

      if (parentComment.projectId !== projectId) {
        throw new BadRequestException(
          'Комментарий не принадлежит этому проекту',
        );
      }

      if (parentComment.parentId) {
        throw new BadRequestException(
          'Можно отвечать только на основные комментарии',
        );
      }
    }

    const comment = await this.prismaService.comment.create({
      data: {
        text,
        userId: user.id,
        projectId,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    if (parentId) {
      await this.notificationService.notifyCommentReply(
        user.id,
        parentId,
        text,
      );
    } else {
      await this.notificationService.notifyProjectComment(
        user.id,
        projectId,
        comment.id,
        text,
      );
    }

    return { ...comment, repliesCount: comment._count.replies };
  }

  async update(user: User, input: UpdateCommentInput) {
    const { id, text } = input;

    const comment = await this.prismaService.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    if (comment.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому комментарию');
    }

    const updated = await this.prismaService.comment.update({
      where: { id },
      data: { text },
      include: {
        user: { select: { username: true, id: true, avatar: true } },
        _count: { select: { replies: true } },
      },
    });

    return { ...updated, repliesCount: updated._count.replies };
  }

  async remove(user: User, id: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
      include: { _count: { select: { replies: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    if (comment.userId !== user.id) {
      throw new ForbiddenException('Нет доступа к этому комментарию');
    }

    await this.prismaService.comment.delete({
      where: { id },
    });

    return true;
  }

  async findByProject(filter: FilterCommentInput) {
    const { projectId, limit = 20, page = 1, parentId } = filter;
    const skip = (page - 1) * limit;

    const project = await this.prismaService.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    const [comments, total] = await Promise.all([
      this.prismaService.comment.findMany({
        where: { projectId, parentId: null },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.comment.count({
        where: { projectId, parentId: null },
      }),
    ]);

    return {
      data: comments.map(comment => ({
        ...comment,
        repliesCount: comment._count.replies,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReplies(input: GetRepliesInput) {
    const { commentId, limit = 20, page = 1 } = input;
    const skip = (page - 1) * limit;

    const parentComment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      throw new NotFoundException('Комментарий не найден');
    }

    const [replies, total] = await Promise.all([
      await this.prismaService.comment.findMany({
        where: { parentId: commentId },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },

        orderBy: { createdAt: 'asc' },
      }),
      await this.prismaService.comment.count({
        where: { parentId: commentId },
      }),
    ]);

    return {
      data: replies.map(reply => ({
        ...reply,
        replyCount: 0,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectCommentCount(projectId: string) {
    const count = await this.prismaService.comment.count({
      where: { projectId },
    });

    return { count };
  }
}
