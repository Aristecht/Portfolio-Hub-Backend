import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import type { User } from '../../../../prisma/generated/prisma/client';
import { getChatMessagesInput } from './inputs/get-chat-messages.input';
import { DeleteMessageInput } from './inputs/delete-message.input';
import { EditMessageInput } from './inputs/edit-message.input';

@Injectable()
export class ChatService {
  constructor(private readonly prismaService: PrismaService) {}
  //
  async getOrCreateChat(user: User, otherUserId: string) {
    if (user.id === otherUserId) {
      throw new ForbiddenException('Нельзя создать чат с самим собой');
    }

    const existingChat = await this.prismaService.chat.findFirst({
      where: {
        AND: [
          { chatMembers: { some: { userId: user.id } } },
          { chatMembers: { some: { userId: otherUserId } } },
          {
            chatMembers: {
              every: { userId: { in: [user.id, otherUserId] } },
            },
          },
        ],
      },
      include: {
        chatMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    const newChat = await this.prismaService.chat.create({
      data: {
        chatMembers: {
          create: [{ userId: user.id }, { userId: otherUserId }],
        },
      },
      include: {
        chatMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
        messages: true,
      },
    });

    return newChat;
  }
  //
  async getUserChats(userId: string) {
    const chats = await this.prismaService.chat.findMany({
      where: {
        chatMembers: {
          some: { userId },
        },
      },
      include: {
        chatMembers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map(chat => ({
      id: chat.id,
      members: chat.chatMembers.map(member => member.user),
      lastMessage: chat.messages[0] || null,
      unreadCount: chat._count.messages,
      updatedAt: chat.updatedAt,
    }));
  }

  //
  async getChatMessages(userId: string, input: getChatMessagesInput) {
    const { chatId, limit = 50, page = 1 } = input;

    const skip = (page - 1) * limit;

    const member = await this.prismaService.chatMember.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Вы не участник этого чата');
    }

    const [messages, total] = await Promise.all([
      this.prismaService.message.findMany({
        where: { chatId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      this.prismaService.message.count({
        where: { chatId },
      }),
    ]);

    return {
      data: messages.reverse(),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  //
  async sendMessage(chatId: string, text: string, userId: string) {
    const member = await this.prismaService.chatMember.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Вы не участник этого чата');
    }

    const message = await this.prismaService.message.create({
      data: {
        chatId,
        senderId: userId,
        text,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    await this.prismaService.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  }
  //
  async markMessageAsRead(chatId: string, messageId: string, userId: string) {
    const member = await this.prismaService.chatMember.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Вы не участник этого чата');
    }

    const message = await this.prismaService.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.chatId !== chatId) {
      throw new NotFoundException('Сообщение не найдено');
    }

    await this.prismaService.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        createdAt: { lte: message.createdAt },
        isRead: false,
      },
      data: { isRead: true },
    });

    await this.prismaService.chatMember.update({
      where: {
        chatId_userId: { userId, chatId },
      },
      data: {
        lastReadMessageId: messageId,
        lastReadAt: new Date(),
      },
    });
  }

  async getChatMemberIds(chatId: string): Promise<string[]> {
    const members = await this.prismaService.chatMember.findMany({
      where: { chatId },
      select: { userId: true },
    });
    return members.map(m => m.userId);
  }

  //
  async setUserOnline(userId: string, isOnline: boolean) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { lastSeenAt: isOnline ? null : new Date(), isOnline },
    });
  }

  //
  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prismaService.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои сообщения');
    }

    await this.prismaService.message.delete({
      where: { id: messageId },
    });

    return { chatId: message.chatId, messageId };
  }

  //
  async editMessage(userId: string, input: EditMessageInput) {
    const { messageId, newText } = input;

    const message = await this.prismaService.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои сообщения');
    }

    const updated = await this.prismaService.message.update({
      where: { id: messageId },
      data: { text: newText, isEdited: true },
    });

    return updated;
  }
}
