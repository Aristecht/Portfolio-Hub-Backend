import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from '../libs/mail/mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../libs/storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CronService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async deleteDeactivatedAccount() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deactivatedAccounts = await this.prismaService.user.findMany({
      where: {
        isDeactivated: true,
        deactivatedAt: { lte: sevenDaysAgo },
      },
    });

    for (const user of deactivatedAccounts) {
      await this.mailService.sendAccountDeletion(user.email);
      await this.storageService.remove(user.avatar);
    }

    console.log('deactivatedAccounts: ', deactivatedAccounts);

    await this.prismaService.user.deleteMany({
      where: {
        isDeactivated: true,
        deactivatedAt: { lte: sevenDaysAgo },
      },
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async verifyChannel() {
    const users = await this.prismaService.user.findMany({
      include: { notificationsSettings: true },
    });

    for (const user of users) {
      const followerCount = await this.prismaService.follow.count({
        where: { followingId: user.id },
      });

      if (followerCount >= 10) {
        await this.prismaService.user.update({
          where: {
            id: user.id,
            isVerified: false,
          },
          data: {
            isVerified: true,
          },
        });

        if (
          user.notificationsSettings.siteNotifications &&
          user.notificationsSettings.pushNotifications
        ) {
          await this.notificationService.notifyAccountVerified(user.id);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async deteleOldNotitifications() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await this.prismaService.notifications.deleteMany({
      where: { createdAt: { lte: sevenDaysAgo } },
    });
  }
}
