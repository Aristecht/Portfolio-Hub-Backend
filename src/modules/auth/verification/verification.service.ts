import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { MailService } from '../../libs/mail/mail.service';
import { VerificationInput } from './inputs/verification.input';
import { getSessionMetadata } from '../../../shared/utils/session-metadata.util';
import { saveSession } from '../../../shared/utils/session.util';
import type { Request } from 'express';
import {
  TokenType,
  type User,
} from '../../../../prisma/generated/prisma/client';
import { generateToken } from '../../../shared/utils/generate-token.util';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly notificaitonService: NotificationsService,
  ) {}

  async verify(req: Request, input: VerificationInput, userAgent: string) {
    const { token } = input;

    const existingToken = await this.prismaService.token.findFirst({
      where: {
        token,
        type: TokenType.EMAIL_VERIFY,
      },
    });

    if (!existingToken) {
      throw new NotFoundException('Токен не найден');
    }

    const hasExpired = new Date(existingToken.expiresIn) < new Date();

    if (hasExpired) {
      throw new BadRequestException('Токен истек');
    }

    const user = await this.prismaService.user.update({
      where: {
        id: existingToken.userId,
      },
      data: {
        isEmailVerified: true,
      },
    });

    await this.prismaService.token.delete({
      where: {
        id: existingToken.id,
        type: TokenType.EMAIL_VERIFY,
      },
    });

    const metadata = getSessionMetadata(req, userAgent);

    await this.notificaitonService.notifyAccountVerified(user.id);

    return saveSession(req, user, metadata);
  }

  async sendVerificationToken(user: User) {
    const VerificationToken = await generateToken(
      this.prismaService,
      user,
      TokenType.EMAIL_VERIFY,
    );

    await this.mailService.sendVerificationToken(
      user.email,
      VerificationToken.token,
    );

    return true;
  }
}
