import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { LoginInput } from './inputs/login.input';
import { verify } from 'argon2';
import { type Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getSessionMetadata } from '../../../shared/utils/session-metadata.util';
import { RedisService } from '../../../core/redis/redis.service';
import {
  destroySession,
  saveSession,
} from '../../../shared/utils/session.util';
import { VerificationService } from '../verification/verification.service';
import { TOTP } from 'otpauth';

@Injectable()
export class SessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly verificationService: VerificationService,
  ) {}

  async findByUser(req: Request) {
    const prefix = this.configService.getOrThrow<string>('SESSION_FOLDER');

    const keys = await this.redisService.client.keys(`${prefix}*`);

    const userSessions = [];

    for (const key of keys) {
      const sessionData = await this.redisService.client.get(key);

      if (sessionData && typeof sessionData === 'string') {
        const session = JSON.parse(sessionData);
        const sessionId = key.split(':')[1];

        userSessions.push({
          ...session,
          id: sessionId,
          isCurrent: sessionId === req.sessionID,
        });
      }
    }

    userSessions.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return userSessions;
  }

  async findCurrent(req: Request) {
    const sessionId = req.session.id;
    const prefix = this.configService.getOrThrow<string>('SESSION_FOLDER');
    const sessionData = await this.redisService.client.get(
      `${prefix}${sessionId}`,
    );

    if (sessionData && typeof sessionData === 'string') {
      const session = JSON.parse(sessionData);
      return {
        ...session,
        id: sessionId,
      };
    }

    throw new NotFoundException('Сессия не найдена');
  }

  async login(req: Request, input: LoginInput, userAgent: string) {
    const { login, password, pin } = input;

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [
          {
            username: { equals: login },
          },
          {
            email: { equals: login },
          },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Этот аккаунт создан через внешний сервис. Используйте вход через Google или восстановите пароль.',
      );
    }

    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный пароль');
    }

    if (!user.isEmailVerified) {
      await this.verificationService.sendVerificationToken(user);

      throw new BadRequestException(
        'Аккаунт не верефицирован. Пожалуйста проверьте свою почту для подтверждения',
      );
    }

    if (user.isTotpEnabled) {
      if (!user.totpSecret) {
        throw new InternalServerErrorException(
          'Для аккаунта некорректно настроена двухфакторная аутентификация',
        );
      }

      if (!pin) {
        return {
          message: 'Необходим код для завершения авторизации',
        };
      }

      const totp = new TOTP({
        issuer: 'Portfolio-Hub',
        label: `${user.email}`,
        algorithm: 'SHA1',
        digits: 6,
        secret: user.totpSecret,
      });

      const delta = totp.validate({ token: pin });

      if (delta === null) {
        throw new BadRequestException('Неверный код');
      }
    }

    const metadata = getSessionMetadata(req, userAgent);

    return {
      user: saveSession(req, user, metadata),
    };
  }

  async logout(req: Request) {
    return destroySession(req, this.configService);
  }

  async clearCookie(req: Request) {
    req.res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));
    return true;
  }

  async remove(req: Request, id: string) {
    if (req.session.id === id) {
      throw new ConflictException('Текущую сессию удалить нельзя');
    }
    const prefix = this.configService.getOrThrow<string>('SESSION_FOLDER');

    await this.redisService.client.del(`${prefix}${id}`);

    return true;
  }
}
