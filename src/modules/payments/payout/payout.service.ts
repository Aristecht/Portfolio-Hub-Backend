import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  PayoutMethod,
  PayoutStatus,
  type User,
} from '../../../../prisma/generated/prisma/client';
import { HistoryPaymentInput } from '../../donation/inputs/page-limit.input';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PayoutService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

  async requestPayout(user: User) {
    const existing = await this.prismaService.payout.findFirst({
      where: { userId: user.id, status: { in: ['PENDING', 'PROCESSING'] } },
    });

    if (existing) {
      throw new BadRequestException('У вас уже есть заявка на вывод средств');
    }

    if (!user.payoutMethod) {
      throw new BadRequestException(
        'Сначала настройте способ получения средств в настройках',
      );
    }

    const balance = await this.getAvailableBalance(user.id);

    // 1000 тг
    const minPayout = 100000;

    if (balance < minPayout) {
      throw new BadRequestException(
        `Минимальная сумма для вывода ${minPayout / 100} ₸`,
      );
    }

    const payout = await this.prismaService.payout.create({
      data: {
        userId: user.id,
        amount: balance,
        currency: 'KZT',
        status: PayoutStatus.PENDING,
        method: user.payoutMethod,
        cardNumber: user.bankCardNumber,
        phoneNumber: user.kaspiPhone,
        iban: user.bankIBAN,
      },
    });

    return {
      payoutId: payout.id,
      amount: balance / 100,
      method: user.payoutMethod,
      status: PayoutStatus.PENDING,
      message:
        'Заявка на вывод средств создана. Обработка займёт 1-3 рабочих дня.',
    };
  }

  async startProcessingPayout(payoutId: string) {
    const payout = await this.prismaService.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new BadRequestException('Заявка не найдена');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Заявка уже обрабатывается');
    }

    const updated = await this.prismaService.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PROCESSING,
      },
    });

    return {
      success: true,
      status: updated.status,
    };
  }

  // only ожидающие
  async getPendingPayouts(input?: HistoryPaymentInput) {
    const { limit = 20, page = 1 } = input;

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prismaService.payout.findMany({
        where: { status: PayoutStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              kaspiPhone: true,
              bankIBAN: true,
              bankCardNumber: true,
              bankCardHolder: true,
              payoutMethod: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prismaService.payout.count({
        where: { status: PayoutStatus.PENDING },
      }),
    ]);

    return {
      data: payouts.map(payout => ({
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        createdAt: payout.createdAt,
        user: {
          id: payout.user.id,
          username: payout.user.username,
        },
        payoutDetails: {
          method: payout.method,
          phone: payout.phoneNumber ?? undefined,
          card: payout.cardNumber ?? undefined,
          iban: payout.iban ?? undefined,
        },
      })),
      meta: {
        page,
        total,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  // все
  async getAllPayouts(input?: HistoryPaymentInput) {
    const { limit = 20, page = 1 } = input;

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prismaService.payout.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              kaspiPhone: true,
              bankIBAN: true,
              bankCardNumber: true,
              bankCardHolder: true,
              payoutMethod: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prismaService.payout.count({
        where: { status: PayoutStatus.PENDING },
      }),
    ]);

    return {
      data: payouts.map(payout => ({
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        createdAt: payout.createdAt,
        user: {
          id: payout.user.id,
          username: payout.user.username,
        },
        payoutDetails: {
          method: payout.method,
          phone: payout.phoneNumber ?? undefined,
          card: payout.cardNumber ?? undefined,
          iban: payout.iban ?? undefined,
        },
      })),
      meta: {
        page,
        total,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approvePayout(payoutId: string, transactionId?: string) {
    const payout = await this.prismaService.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new BadRequestException('Заявка не найдена');
    }

    if (
      payout.status !== PayoutStatus.PENDING &&
      payout.status !== PayoutStatus.PROCESSING
    ) {
      throw new BadRequestException('Заявка уже обработана');
    }

    const updated = await this.prismaService.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.COMPLETED,
        transactionId: transactionId || null,
        processedAt: new Date(),
      },
    });

    await this.notificationService.notifyPayoutSuccess(updated.userId);

    return {
      success: true,
      payoutId: updated.id,
      amount: updated.amount / 100,
    };
  }

  async rejectPayout(payoutId: string, reason: string) {
    const payout = await this.prismaService.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new BadRequestException('Заявка не найдена');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Заявка уже обработана');
    }

    await this.prismaService.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.FAILED,
        failureReason: reason,
      },
    });

    return true;
  }

  private async getAvailableBalance(userId: string): Promise<number> {
    const [received, payouts, pendingPayouts] = await Promise.all([
      this.prismaService.payment.aggregate({
        where: {
          recipientId: userId,
          status: 'SUCCEEDED',
        },
        _sum: { amount: true, platformFee: true },
      }),
      this.prismaService.payout.aggregate({
        where: {
          userId,
          status: { in: ['COMPLETED', 'PROCESSING'] },
        },
        _sum: { amount: true },
      }),
      this.prismaService.payout.aggregate({
        where: {
          userId,
          status: 'PENDING',
        },
        _sum: { amount: true },
      }),
    ]);

    const totalReceived = received._sum.amount ?? 0;
    const totalPlatformFee = received._sum.platformFee ?? 0;
    const totalPaidOut = payouts._sum.amount ?? 0;
    const totalPending = pendingPayouts._sum.amount ?? 0;

    return totalReceived - totalPlatformFee - totalPaidOut - totalPending;
  }

  async getPayoutHistory(user: User, input?: HistoryPaymentInput) {
    const { page = 1, limit = 20 } = input;

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      await this.prismaService.payout.findMany({
        where: {
          userId: user.id,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      await this.prismaService.payout.count({
        where: { userId: user.id },
      }),
    ]);

    return {
      data: payouts.map(payout => ({
        ...payout,
        amount: payout.amount / 100,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
