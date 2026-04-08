import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { MailService } from '../../libs/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { TokenType } from '../../../../prisma/generated/prisma/enums';
import { destroySession } from '../../../shared/utils/session.util';
import { type User } from '../../../../prisma/generated/prisma/client';
import { generateToken } from '../../../shared/utils/generate-token.util';
import { getSessionMetadata } from '../../../shared/utils/session-metadata.util';
import { DeactivateAccountInput } from './inputs/deactivate-account.input';
import { verify } from 'argon2';

@Injectable()
export class DeactivateService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async deactivate(
    req: Request,
    input: DeactivateAccountInput,
    user: User,
    userAgent: string,
  ) {
    const { email, password, pin } = input;

    if (user.email !== email) {
      throw new BadRequestException('Неверная почта');
    }

    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword) {
      throw new BadRequestException('Неверный пароль');
    }

    if (!pin) {
      await this.sendDeactivateToken(req, user, userAgent);

      return { message: 'Требуется код подтверждения' };
    }
    await this.validateDeactivateToken(req, pin);

    return { user };
  }

  async validateDeactivateToken(req: Request, token: string) {
    const existingToken = await this.prismaService.token.findFirst({
      where: {
        token,
        type: TokenType.DEACTIVATE_ACCOUNT,
      },
    });

    if (!existingToken) {
      throw new NotFoundException('Токен не найден');
    }

    const hasExpired = new Date(existingToken.expiresIn) < new Date();

    if (hasExpired) {
      throw new BadRequestException('Токен истек');
    }

    await this.prismaService.user.update({
      where: {
        id: existingToken.userId,
      },
      data: {
        isDeactivated: true,
        deactivatedAt: new Date(),
      },
    });

    await this.prismaService.token.delete({
      where: {
        id: existingToken.id,
        type: TokenType.DEACTIVATE_ACCOUNT,
      },
    });

    return destroySession(req, this.configService);
  }

  async sendDeactivateToken(req: Request, user: User, userAgent: string) {
    const deactivationToken = await generateToken(
      this.prismaService,
      user,
      TokenType.DEACTIVATE_ACCOUNT,
      false,
    );

    const metadata = getSessionMetadata(req, userAgent);

    await this.mailService.sendDeactivateToken(
      user.email,
      deactivationToken.token,
      metadata,
    );
  }
}
