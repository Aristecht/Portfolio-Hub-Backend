import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import {
  PaymentMethod,
  PaymentsStatus,
  PayoutMethod,
  User,
} from '../../../prisma/generated/prisma/client';
import { CreateDonationTierInput } from './inputs/create-donation-tier.input';
import { UpdateDonationTierInput } from './inputs/update-donation-tier.input';
import { KaspiPayService } from '../payments/kaspi-pay/kaspi-pay.service';
import { FreedomPayService } from '../payments/freedom-pay/freedom-pay.service';
import { CreatePaymentInput } from './inputs/create-payment.input';
import { HistoryPaymentInput } from './inputs/page-limit.input';
import { RefundPaymentInput } from './inputs/refund-payement.input';
import { SetupPayoutInput } from './inputs/setup-payout.input';

interface IKaspiCallbackData {
  transactionId: string;
  status: PaymentsStatus;
  amount: number;
  paidAt: string;
}

interface IFreedomCallbackData {
  pg_order_id: string;
  pg_result: string;
  pg_amount: string;
}

@Injectable()
export class DonationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationsService,
    private readonly kaspiPayService: KaspiPayService,
    private readonly freedomPayService: FreedomPayService,
  ) {}

  async createTier(user: User, input: CreateDonationTierInput) {
    const { amount, benefits, title, description } = input;

    if (!user.isVerified) {
      throw new BadRequestException(
        'Только верифицированные пользователи могут создавать спонсорство',
      );
    }

    if (amount < 100) {
      throw new BadRequestException('Минимальная сумма доната 100 тенге');
    }

    const count = await this.prismaService.donationTier.count({
      where: { authorId: user.id },
    });

    if (count >= 3) {
      throw new BadRequestException('Максимум 3 уровня доната');
    }

    const tier = await this.prismaService.donationTier.create({
      data: {
        title,
        description,
        amount: amount * 100,
        benefits: benefits || [],
        authorId: user.id,
        position: count,
      },
    });

    return {
      ...tier,
      amount: tier.amount / 100,
    };
  }

  async updateTier(user: User, input: UpdateDonationTierInput) {
    const { amount, benefits, title, description, isActive, tierId } = input;

    const tier = await this.prismaService.donationTier.findUnique({
      where: { id: tierId },
    });

    if (!tier) {
      throw new NotFoundException('Уровень доната не найден');
    }

    if (tier.authorId !== user.id) {
      throw new ForbiddenException('Нет доступа');
    }

    const updated = await this.prismaService.donationTier.update({
      where: { id: tierId },
      data: {
        title,
        description,
        amount: amount ? amount * 100 : undefined,
        benefits: benefits || [],
        isActive,
      },
    });

    return { ...updated, amount: updated.amount / 100 };
  }

  async removeTier(user: User, tierId: string) {
    const tier = await this.prismaService.donationTier.findUnique({
      where: { id: tierId },
    });

    if (!tier) {
      throw new NotFoundException('Уровень доната не найден');
    }

    if (tier.authorId !== user.id) {
      throw new ForbiddenException('Нет доступа');
    }

    await this.prismaService.donationTier.delete({
      where: { id: tierId },
    });

    return true;
  }

  async getTiersByAuthor(username: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const tiers = await this.prismaService.donationTier.findMany({
      where: { authorId: user.id, isActive: true },
      orderBy: { position: 'asc' },
    });

    return tiers.map(tier => ({
      ...tier,
      amount: tier.amount / 100,
    }));
  }

  //--------------------- Payments --------------------
  //--------------------- Payments --------------------

  async setupPayoutMethod(user: User, input: SetupPayoutInput) {
    const { method, cardHolder, cardNumber, iban, kaspiPhone } = input;

    if (!user.isVerified) {
      throw new BadRequestException(
        'Только верифицированные пользователи настраивать метод вывода средств',
      );
    }

    if (method === PayoutMethod.KASPI_TRANSFER) {
      if (!kaspiPhone) {
        throw new BadRequestException('Укажите номер Kaspi');
      }

      const phoneRegex = /^\+?7[0-9]{10}$/;
      if (!phoneRegex.test(kaspiPhone)) {
        throw new BadRequestException('Неверный формат номера телефона');
      }
    }

    if (method === PayoutMethod.CARD_TRANSFER) {
      if (!cardNumber || !cardHolder) {
        throw new BadRequestException('Укажите номер карты и владельца');
      }

      const cardRegex = /^[0-9]{16}$/;
      if (!cardRegex.test(cardNumber.replace(/\s/g, ''))) {
        throw new BadRequestException('Неверный формат номера карты');
      }
    }

    if (method === PayoutMethod.BANK_TRANSFER) {
      if (!iban) {
        throw new BadRequestException('Укажите IBAN');
      }

      const ibanRegex = /^KZ[0-9]{18}$/;
      if (!ibanRegex.test(iban)) {
        throw new BadRequestException('Неверный формат IBAN');
      }
    }

    const updated = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        payoutMethod: method,
        kaspiPhone: method === PayoutMethod.KASPI_TRANSFER ? kaspiPhone : null,
        bankCardNumber:
          method === PayoutMethod.CARD_TRANSFER ? cardNumber : null,
        bankCardHolder:
          method === PayoutMethod.CARD_TRANSFER ? cardHolder : null,
        bankIBAN: method === PayoutMethod.BANK_TRANSFER ? iban : null,
      },
    });

    return {
      success: true,
      method: updated.payoutMethod,
    };
  }

  async updatePayoutMethod(user: User, input: SetupPayoutInput) {
    if (!user.payoutMethod) {
      throw new BadRequestException(
        'Метод вывода не настроен. Сначала выполните настройку.',
      );
    }

    return this.setupPayoutMethod(user, input);
  }

  async removePayoutMethod(user: User) {
    const found = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: { payoutMethod: true },
    });

    if (!found?.payoutMethod) {
      throw new BadRequestException('Метод вывода не настроен');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        payoutMethod: null,
        kaspiPhone: null,
        bankCardNumber: null,
        bankCardHolder: null,
        bankIBAN: null,
      },
    });

    return true;
  }

  async getPayoutSettings(user: User) {
    const settings = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: {
        payoutMethod: true,
        bankCardHolder: true,
        bankCardNumber: true,
        kaspiPhone: true,
        bankIBAN: true,
      },
    });

    return {
      method: settings.payoutMethod,
      kaspiPhone: settings.kaspiPhone,
      cardNumber: settings.bankCardNumber
        ? `****${settings.bankCardNumber.slice(-4)}`
        : null,
      cardHolder: settings.bankCardHolder,
      iban: settings.bankIBAN
        ? `${settings.bankIBAN.slice(0, 4)}****${settings.bankIBAN.slice(-4)}`
        : null,
    };
  }

  async createPayment(donor: User, input: CreatePaymentInput) {
    const { paymentMethod, tierId, isAnonymous, message } = input;

    if (
      paymentMethod !== PaymentMethod.KASPI_PAY &&
      paymentMethod !== PaymentMethod.FREEDOM_PAY
    ) {
      throw new BadRequestException('Неподдерживаемый метод оплаты');
    }

    const tier = await this.prismaService.donationTier.findUnique({
      where: { id: tierId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!tier) {
      throw new NotFoundException('Уровень доната не найден');
    }

    if (tier.authorId === donor.id) {
      throw new BadRequestException('Нельзя задонатить самому себе');
    }

    const payment = await this.prismaService.payment.create({
      data: {
        donorId: donor.id,
        recipientId: tier.authorId,
        tierId: tier.id,
        amount: tier.amount,
        currency: 'KZT',
        message,
        isAnonymous: isAnonymous || false,
        status: PaymentsStatus.PENDING,
        paymentMethod,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    try {
      if (paymentMethod === PaymentMethod.KASPI_PAY) {
        return await this.createKaspiPayment(payment, tier, donor);
      } else {
        return await this.createFreedomPayment(payment, tier, donor);
      }
    } catch (error) {
      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: { status: PaymentsStatus.FAILED },
      });

      throw new BadRequestException('Не удалось создать платеж');
    }
  }

  private async createKaspiPayment(payment: any, tier: any, donor: User) {
    const platformFee = Math.floor(tier.amount * 0.05);

    const kaspiPayment = await this.kaspiPayService.createPayment({
      amount: tier.amount,
      description: `Donation ${tier.title}`,
      orderId: payment.id,
      customerPhone: donor.phoneNumber,
    });

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        kaspiTransactionId: kaspiPayment.transactionId,
        kaspiPaymentUrl: kaspiPayment.paymentUrl,
        kaspiQrCode: kaspiPayment.qrCode,
        platformFee,
        expiresAt: kaspiPayment.expiresAt,
      },
    });

    return {
      paymentId: payment.id,
      method: PaymentMethod.KASPI_PAY,
      paymentUrl: kaspiPayment.paymentUrl,
      webUrl: kaspiPayment.webUrl,
      qrCode: kaspiPayment.qrCode,
      amount: (tier.amount - platformFee) / 100,
      platformFee: platformFee / 100,
      expiresAt: kaspiPayment.expiresAt,
    };
  }

  private async createFreedomPayment(payment: any, tier: any, donor: User) {
    const platformFee = Math.floor(tier.amount * 0.05);

    const freedomPayment = await this.freedomPayService.createPayment({
      email: donor.email,
      phone: donor.phoneNumber,
      amount: tier.amount,
      description: `Donation ${tier.title}`,
      orderId: payment.id,
    });

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        freedomPayPaymentUrl: freedomPayment.paymentUrl,
        freedomPayTransactionId: freedomPayment.transactionId,
        platformFee,
      },
    });

    return {
      paymentId: payment.id,
      method: PaymentMethod.FREEDOM_PAY,
      paymentUrl: freedomPayment.paymentUrl,
      amount: (tier.amount - platformFee) / 100,
      platformFee: platformFee / 100,
      expiresAt: payment.expiresAt,
    };
  }

  async handleKaspiCallback(data: IKaspiCallbackData) {
    const { amount, paidAt, status, transactionId } = data;

    const payment = await this.prismaService.payment.findUnique({
      where: { kaspiTransactionId: transactionId },
      include: {
        donor: { select: { id: true, displayName: true } },
        recipent: { select: { id: true, username: true } },
      },
    });

    if (!payment) {
      console.log(`Payment not found for Kaspi transaction: ${transactionId}`);
      return { success: false };
    }

    let newStatus: PaymentsStatus;

    switch (status) {
      case 'SUCCEEDED':
        newStatus = PaymentsStatus.SUCCEEDED;
        break;
      case 'FAILED':
        newStatus = PaymentsStatus.FAILED;
        break;
      case 'EXPIRED':
        newStatus = PaymentsStatus.EXPIRED;
        break;
      default:
        newStatus = PaymentsStatus.PROCESSING;
    }

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: paidAt ? new Date(paidAt) : null,
      },
    });

    if (newStatus === PaymentsStatus.SUCCEEDED) {
      await this.notificationService.notifyKaspiDonation(
        payment.donorId,
        payment.recipientId,
        amount,
        payment.isAnonymous,
      );

      return true;
    }
  }

  async handleFreedomCallback(data: IFreedomCallbackData) {
    const { pg_amount, pg_order_id, pg_result } = data;

    const orderId = pg_order_id;
    const amount = parseFloat(pg_amount) * 100;

    // Convert FreedomPay status code to PaymentsStatus enum
    // FreedomPay uses numeric codes: 1 = success, other values = failure
    const statusCode = pg_result.trim();
    let status: PaymentsStatus;

    if (statusCode === '1') {
      status = PaymentsStatus.SUCCEEDED;
    } else {
      status = PaymentsStatus.FAILED;
    }

    const payment = await this.prismaService.payment.findUnique({
      where: { id: orderId },
      include: {
        donor: { select: { id: true, displayName: true } },
        recipent: { select: { id: true, username: true } },
      },
    });

    if (payment.status !== 'PENDING') {
      console.warn(`Duplicate callback for payment ${orderId}`);
      return { success: true };
    }

    if (!payment) {
      console.log(`Payment not found for Kaspi transaction: ${orderId}`);
      return { success: false };
    }

    if (payment.amount !== amount) {
      console.log(
        `Amount mismatch for payment ${orderId}. Expected ${payment.amount}, got ${amount}`,
      );
      return { success: false };
    }

    let newStatus: PaymentsStatus = status;

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: status === PaymentsStatus.SUCCEEDED ? new Date() : null,
      },
    });

    if (status === PaymentsStatus.SUCCEEDED) {
      await this.notificationService.notifyFreedomDonation(
        payment.donorId,
        payment.recipientId,
        amount,
        payment.isAnonymous,
      );

      return true;
    }
  }

  async createRefund(user: User, input: RefundPaymentInput) {
    const { paymentId, reason } = input;
    const payment = await this.prismaService.payment.findUnique({
      where: { id: paymentId },
      include: {
        donor: { select: { id: true, displayName: true } },
        recipent: { select: { id: true, username: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    if (payment.recipientId !== user.id) {
      throw new ForbiddenException('Только получатель может оформить возврат');
    }

    if (payment.status !== PaymentsStatus.SUCCEEDED) {
      throw new BadRequestException(
        'Возврат возможен только для успешных платежей',
      );
    }

    const daysSincePayment = Math.floor(
      (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSincePayment >= 3) {
      throw new BadRequestException('Возврат возможен только в течение 3 дня');
    }

    try {
      let refundResult;

      if (payment.paymentMethod === PaymentMethod.KASPI_PAY) {
        refundResult = await this.kaspiPayService.refundPayment(
          payment.kaspiTransactionId,
          payment.amount,
        );
      } else {
        refundResult = await this.freedomPayService.refundPayment(
          payment.freedomPayTransactionId,
          payment.amount,
        );
      }

      await this.prismaService.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentsStatus.REFUNDED,
        },
      });

      await this.notificationService.notifyRefundProcessed(
        user.id,
        payment.donorId,
        payment.amount,
        reason,
      );

      return {
        success: true,
        refundId: refundResult.refundId,
        amount: payment.amount / 100,
        status: refundResult.status,
      };
    } catch (error) {
      console.log(`Refund failed for payment ${paymentId}`, error);
      throw new BadRequestException('Не удалось создать возврат');
    }
  }

  async getBalance(user: User) {
    const received = await this.prismaService.payment.aggregate({
      where: {
        recipientId: user.id,
        status: PaymentsStatus.SUCCEEDED,
      },
      _sum: { amount: true, platformFee: true },
    });

    const payouts = await this.prismaService.payout.aggregate({
      where: {
        userId: user.id,
        status: { in: ['COMPLETED'] },
      },
      _sum: { amount: true },
    });

    const totalReceived = received._sum.amount || 0;
    const totalPlatformfee = received._sum.platformFee || 0;

    const available =
      totalReceived - totalPlatformfee - (payouts._sum.amount || 0);

    return {
      availableBalance: available / 100,
      totalReceived: totalReceived / 100,
      totalPaidOut: (payouts._sum.amount || 0) / 100,
    };
  }

  async getDonationStats(user: User) {
    const [totalReceived, totalGiven, donorsCount, totalEarnOnPlatformfee] =
      await Promise.all([
        this.prismaService.payment.aggregate({
          where: { recipientId: user.id, status: PaymentsStatus.SUCCEEDED },
          _sum: { amount: true },
          _count: true,
        }),
        this.prismaService.payment.aggregate({
          where: { donorId: user.id, status: PaymentsStatus.SUCCEEDED },
          _sum: { amount: true },
          _count: true,
        }),
        this.prismaService.payment.groupBy({
          by: ['donorId'],
          where: {
            recipientId: user.id,
            status: PaymentsStatus.SUCCEEDED,
          },
        }),
        this.prismaService.payment.aggregate({
          where: { status: PaymentsStatus.SUCCEEDED },
          _sum: { amount: true, platformFee: true },
        }),
      ]);

    return {
      totalReceived: (totalReceived._sum.amount || 0) / 100,
      totalGiven: (totalGiven._sum.amount || 0) / 100,
      donationsReceivedCount: totalReceived._count,
      donationsGivenCount: totalGiven._count,
      uniqueDonorsCount: donorsCount.length,
    };
  }

  async getEarnOnFee() {
    const [totalReceived, totalEarnOnPlatformfee] = await Promise.all([
      this.prismaService.payment.aggregate({
        where: { status: PaymentsStatus.SUCCEEDED },
        _sum: { amount: true },
        _count: true,
      }),

      this.prismaService.payment.aggregate({
        where: { status: PaymentsStatus.SUCCEEDED },
        _sum: { platformFee: true },
      }),
    ]);

    const totalReceivedd = totalReceived._sum.amount || 0;
    const totalPlatformfee = totalEarnOnPlatformfee._sum.platformFee || 0;

    return {
      totalReceived: totalReceivedd / 100,
      totalPlatformFee: totalPlatformfee / 100,
    };
  }

  async getPaymentHistory(user: User, input?: HistoryPaymentInput) {
    const { page = 1, limit = 20 } = input;

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      await this.prismaService.payment.findMany({
        where: {
          OR: [{ donorId: user.id, recipientId: user.id }],
        },
        skip,
        take: limit,
        include: {
          donor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          recipent: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          donationTier: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      await this.prismaService.payment.count({
        where: { OR: [{ donorId: user.id, recipientId: user.id }] },
      }),
    ]);

    return {
      data: payments.map(payment => ({
        ...payment,
        amount: payment.amount / 100,
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
