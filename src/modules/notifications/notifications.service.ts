import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  NotificationsType,
  type User,
} from '../../../prisma/generated/prisma/client';
import { ChangeNotificationsSettingsInput } from './inputs/change-notifications-settings.input';
import { PageLimitInput } from './inputs/page-limit.input';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { RegisterDeviceTokenInput } from './inputs/register-device-token.input';

export interface CreateNotificationData {
  userId: string;
  type: NotificationsType;
  message: string;
  actorId?: string;
  projectId?: string;
  albumId?: string;
  commentId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  private async createNotification(data: CreateNotificationData) {
    if (data.userId === data.actorId) {
      return null;
    }

    const settings = await this.prismaService.notificationsSettings.findUnique({
      where: { userId: data.userId },
    });

    if (settings && !settings.siteNotifications) {
      return null;
    }

    const notification = await this.prismaService.notifications.create({
      data,
    });

    if (settings?.pushNotifications !== false) {
      await this.sendPushNotification(data.userId, {
        title: this.getNotificationTitle(data.type),
        body: data.message,
        data: {
          type: data.type,
          notificationId: notification.id,
          projectId: data.projectId || '',
          actorId: data.actorId || '',
        },
      });
    }

    return notification;
  }

  async findUnreadCount(user: User) {
    const count = await this.prismaService.notifications.count({
      where: { isRead: false, userId: user.id },
    });

    return count;
  }

  async findByUser(user: User, input: PageLimitInput) {
    const { limit = 20, page = 1 } = input;

    const skip = (page - 1) * limit;

    await this.prismaService.notifications.updateMany({
      where: { isRead: false, userId: user.id },
      data: {
        isRead: true,
      },
    });

    const [notifications, total] = await Promise.all([
      await this.prismaService.notifications.findMany({
        where: {
          userId: user.id,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
        },
      }),
      await this.prismaService.notifications.count({
        where: { userId: user.id },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(user: User, notificationIds: string[]) {
    await this.prismaService.notifications.updateMany({
      where: { id: { in: notificationIds }, userId: user.id },
      data: { isRead: true },
    });

    return true;
  }

  async markAllAsRead(user: User) {
    await this.prismaService.notifications.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return true;
  }

  async changeSettings(user: User, input: ChangeNotificationsSettingsInput) {
    const { siteNotifications, pushNotifications } = input;

    const notificationSettings =
      await this.prismaService.notificationsSettings.upsert({
        where: { userId: user.id },
        create: {
          siteNotifications,
          pushNotifications,
          userId: user.id,
        },
        update: {
          siteNotifications,
          pushNotifications,
        },
        include: { user: true },
      });

    return { notificationSettings };
  }

  private getNotificationTitle(type: NotificationsType): string {
    const titles = {
      [NotificationsType.NEW_PROJECT]: '📸 Новый проект',
      [NotificationsType.NEW_FOLLOWER]: '👤 Новый подписчик',
      [NotificationsType.PROJECT_LIKE]: '❤️ Новый лайк',
      [NotificationsType.PROJECT_COMMENT]: '💬 Новый комментарий',
      [NotificationsType.COMMENT_REPLY]: '💬 Ответ на комментарий',
      [NotificationsType.ENABLE_TWO_FACTOR]: '🔒 2FA включена',
      [NotificationsType.DISABLE_TWO_FACTOR]: '🔓 2FA отключена',
      [NotificationsType.VERIFIED_CHANNEL]: '✅ Канал верифицирован',
    };

    return titles[type] || 'Уведомление';
  }

  private async sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ) {
    try {
      const deviceTokens = await this.prismaService.deviceToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (deviceTokens.length === 0) {
        console.log(`[Push] No device tokens for user ${userId}, skipping`);
        return;
      }

      const tokens = deviceTokens.map(t => t.token);
      console.log(`[Push] Sending to user ${userId}, tokens: ${tokens.length}`);

      const response = await this.firebaseService.sendToMultipleDevice(
        tokens,
        notification,
      );

      if (response.failureCount > 0) {
        // remove invalid/unregistered tokens
        const toRemove: string[] = [];

        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            console.log(`Failed to send to ${tokens[index]}: ${resp.error}`);
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              toRemove.push(tokens[index]);
            }
          }
        });

        if (toRemove.length > 0) {
          try {
            await this.prismaService.deviceToken.deleteMany({
              where: { token: { in: toRemove } },
            });
            console.log(`[Push] Removed ${toRemove.length} invalid tokens`);
          } catch (err) {
            console.error('[Push] Failed to remove invalid tokens', err);
          }
        }
      }

      console.log(`[Push] ✅ Sent to user ${userId}`);
    } catch (error) {
      console.error(
        `Failed to send push notification to user ${userId}`,
        error,
      );
    }
  }

  async registerDeviceToken(user: User, input: RegisterDeviceTokenInput) {
    const { token, deviceType, deviceName } = input;

    const existing = await this.prismaService.deviceToken.findUnique({
      where: { token },
    });

    if (existing) {
      return this.prismaService.deviceToken.update({
        where: { id: existing.id },
        data: {
          lastUsedAt: new Date(),
          deviceName,
        },
      });
    }

    const deviceToken = await this.prismaService.deviceToken.create({
      data: {
        deviceName,
        deviceType,
        token,
        userId: user.id,
      },
    });

    return deviceToken;
  }

  async sendChatMessagePushNotification(
    recipientId: string,
    senderDisplayName: string,
    messageText: string,
    chatId: string,
  ) {
    const settings = await this.prismaService.notificationsSettings.findUnique({
      where: { userId: recipientId },
    });

    if (settings?.pushNotifications === false) return;

    const body =
      messageText.length > 100 ? messageText.slice(0, 97) + '...' : messageText;

    await this.sendPushNotification(recipientId, {
      title: `💬 ${senderDisplayName}`,
      body,
      data: { type: 'NEW_MESSAGE', chatId },
    });
  }

  async removeDeviceToken(user: User, token: string) {
    await this.prismaService.deviceToken.delete({
      where: {
        token,
        userId: user.id,
      },
    });

    return true;
  }

  async getDevices(user: User) {
    const devices = await this.prismaService.deviceToken.findMany({
      where: { userId: user.id },
      orderBy: { lastUsedAt: 'desc' },
    });

    return devices;
  }

  //   Сами уведомления

  async notifyNewProject(
    actorId: string,
    projectId: string,
    projectTitle: string,
  ) {
    const followers = await this.prismaService.follow.findMany({
      where: { followingId: actorId },
      include: { follower: { select: { id: true, username: true } } },
    });

    const actor = await this.prismaService.user.findUnique({
      where: { id: actorId },
      select: { username: true, displayName: true },
    });

    if (!actor) return;

    const notificationPromises = followers.map(({ follower }) =>
      this.createNotification({
        userId: follower.id,
        type: NotificationsType.NEW_PROJECT,
        actorId,
        projectId,
        message: `${actor.displayName} опубликовал новый проект "${projectTitle}"`,
      }),
    );

    await Promise.all(notificationPromises);
  }

  async notifyNewFollower(followerId: string, followingId: string) {
    const follower = await this.prismaService.user.findUnique({
      where: { id: followerId },
      select: { displayName: true },
    });

    if (!follower) return;

    await this.createNotification({
      userId: followingId,
      type: NotificationsType.NEW_FOLLOWER,
      message: `${follower.displayName} подписался на вас`,
      actorId: followerId,
    });
  }

  async notifyProjectLike(likerId: string, projectId: string) {
    const [liker, project] = await Promise.all([
      await this.prismaService.user.findUnique({
        where: { id: likerId },
        select: { displayName: true },
      }),
      await this.prismaService.project.findUnique({
        where: { id: projectId },
        select: { title: true, album: { select: { userId: true } } },
      }),
    ]);

    if (!liker || !project) {
      throw new NotFoundException('Данные не найдены');
    }

    await this.createNotification({
      userId: project.album.userId,
      type: NotificationsType.PROJECT_LIKE,
      message: `${liker.displayName} понравился ваш проект "${project.title}"`,
      actorId: likerId,
      projectId,
    });
  }

  async notifyProjectComment(
    commenterId: string,
    projectId: string,
    commentId: string,
    commentText: string,
  ) {
    const [commenter, project] = await Promise.all([
      await this.prismaService.user.findUnique({
        where: { id: commenterId },
        select: { displayName: true },
      }),
      await this.prismaService.project.findUnique({
        where: { id: projectId },
        select: { title: true, album: { select: { userId: true } } },
      }),
    ]);

    if (!commenter || !project) {
      throw new NotFoundException('Данные не найдены');
    }

    const previewText =
      commentText.length > 35
        ? `${commentText.substring(0, 35)}...`
        : commentText;

    await this.createNotification({
      userId: project.album.userId,
      type: NotificationsType.PROJECT_COMMENT,
      message: `${commenter.displayName} прокоментировал ваш проект "${project.title}" -- ${previewText}`,
      actorId: commenterId,
      projectId,
      commentId,
    });
  }

  async notifyCommentReply(
    replierId: string,
    parentCommentId: string,
    replyText: string,
  ) {
    const [replier, parentComment] = await Promise.all([
      await this.prismaService.user.findUnique({
        where: { id: replierId },
        select: { displayName: true },
      }),
      await this.prismaService.comment.findUnique({
        where: { id: parentCommentId },
        select: {
          userId: true,
          projectId: true,
          project: { select: { title: true } },
        },
      }),
    ]);

    if (!replier || !parentComment) {
      throw new NotFoundException('Данные не найдены');
    }

    const previewText =
      replyText.length > 35 ? `${replyText.substring(0, 35)}...` : replyText;

    await this.createNotification({
      userId: parentComment.userId,
      type: NotificationsType.COMMENT_REPLY,
      message: `${replier.displayName} ответил на ваш комментарий -- ${previewText}`,
      actorId: replierId,
      projectId: parentComment.projectId,
      commentId: parentCommentId,
    });
  }

  async enableTwoFactorAuthentication(actorId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: actorId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.createNotification({
      userId: user.id,
      type: NotificationsType.ENABLE_TWO_FACTOR,
      message: `Поздравляем! Вы включили двухфакторную аутентификацию.`,
    });
  }

  async disableTwoFactorAuthentication(actorId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: actorId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.createNotification({
      userId: user.id,
      type: NotificationsType.DISABLE_TWO_FACTOR,
      message: `Двухфакторная аутентификация была отключена.`,
    });
  }

  async notifyKaspiDonation(
    actorId: string,
    recipientId: string,
    amount: number,
    isAnonymous: boolean,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: actorId },
      select: { id: true, displayName: true },
    });

    const donorName = isAnonymous
      ? 'Анонимный пользователь'
      : user?.displayName || 'Пользователь';

    await this.createNotification({
      userId: recipientId,
      message: `${donorName} поддержал вас через Kaspi на ${amount} ₸!`,
      type: NotificationsType.DONATION_RECEIVED,
      actorId,
    });
  }

  async notifyFreedomDonation(
    actorId: string,
    recipientId: string,
    amount: number,
    isAnonymous: boolean,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: actorId },
      select: { id: true, displayName: true },
    });

    const donorName = isAnonymous
      ? 'Анонимный пользователь'
      : user?.displayName || 'Пользователь';

    await this.createNotification({
      userId: recipientId,
      message: `${donorName} поддержал вас через Freedom Pay на ${amount / 100} ₸!`,
      type: NotificationsType.DONATION_RECEIVED,
      actorId,
    });
  }

  async notifyRefundProcessed(
    actorId: string,
    recipientId: string,
    amount: number,
    reason?: string,
  ) {
    await this.createNotification({
      userId: recipientId,
      message: `Возврат ${amount / 100} ₸ обработан${reason ? `: ${reason}` : ''}`,
      type: NotificationsType.DONATION_RECEIVED,
      actorId,
    });
  }

  async notifyAccountVerified(actorId: string) {
    await this.createNotification({
      userId: actorId,
      type: NotificationsType.VERIFIED_CHANNEL,
      message: `Поздравляем! Ваш аккаунт получил подтверждённый статус.`,
    });
  }

  async notifyPayoutSuccess(actorId: string) {
    await this.createNotification({
      userId: actorId,
      message: `Вывод средств прошел успешно. Деньги отправлены вам на счет, который вы указали в профиле.`,
      type: NotificationsType.PAYOUT_SUCCESS,
    });
  }
}
