import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import type { User } from '../../../../prisma/generated/prisma/client';
import { encode } from 'hi-base32';
import { randomBytes } from 'crypto';
import { TOTP } from 'otpauth';
import * as QRCode from 'qrcode';
import { EnableTotpInput } from './inputs/enable-totp.input';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class TotpService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

  async generate(user: User) {
    const secret = encode(randomBytes(15)).replace(/=/g, '').substring(0, 24);

    const totp = new TOTP({
      issuer: 'Portfolio-Hub',
      label: `${user.email}`,
      algorithm: 'SHA1',
      digits: 6,
      secret,
    });

    const otpauthUrl = totp.toString();
    const qrcodeUrl = await QRCode.toDataURL(otpauthUrl);

    return { qrcodeUrl, secret };
  }

  async enable(user: User, input: EnableTotpInput) {
    const { pin, secret } = input;

    const totp = new TOTP({
      issuer: 'Portfolio-Hub',
      label: `${user.email}`,
      algorithm: 'SHA1',
      digits: 6,
      secret,
    });

    const delta = totp.validate({ token: pin });

    if (delta === null) {
      throw new BadRequestException('Неверный код');
    }

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        isTotpEnabled: true,
        totpSecret: secret,
      },
    });

    await this.notificationService.enableTwoFactorAuthentication(user.id);

    return true;
  }

  async disable(user: User) {
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        isTotpEnabled: false,
        totpSecret: null,
      },
    });

    await this.notificationService.disableTwoFactorAuthentication(user.id);

    return true;
  }
}
