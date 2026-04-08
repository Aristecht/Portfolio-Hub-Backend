import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { Profile } from 'passport-google-oauth20';
import { Request } from 'express';
import { OAuthProfile } from '../../../shared/types/oauth.types';
import { getSessionMetadata } from '../../../shared/utils/session-metadata.util';
import { saveSession } from '../../../shared/utils/session.util';

@Injectable()
export class OauthService {
  constructor(private readonly prismaService: PrismaService) {}

  async validateOauthUser(
    profile: OAuthProfile,
    req: Request,
    userAgent: string,
  ) {
    const { provider, providerId, email, name, avatar } = profile;

    // 1. Ищем пользователя по аккаунту (provider + providerId)
    let user = await this.prismaService.user.findFirst({
      where: {
        accounts: {
          some: {
            provider,
            providerId,
          },
        },
      },
    });

    // 2. Если не найден по аккаунту, ищем по email
    if (!user) {
      user = await this.prismaService.user.findUnique({
        where: { email },
      });

      // 3. Если нашли по email, добавляем аккаунт
      if (user) {
        await this.prismaService.account.create({
          data: {
            provider,
            providerId,
            userId: user.id,
          },
        });
      } else {
        // 4. Если не нашли - создаём нового пользователя
        user = await this.prismaService.user.create({
          data: {
            email,
            username: await this.generateUsername(name),
            displayName: name,
            avatar,
            isEmailVerified: true,
            password: '',
            accounts: {
              create: {
                provider,
                providerId,
              },
            },
          },
        });
      }
    }

    const metadata = getSessionMetadata(req, userAgent);
    if (!user) {
      throw new UnauthorizedException('OAuth user not found or not created.');
    }
    return saveSession(req, user, metadata);
  }

  private async generateUsername(name: string): Promise<string> {
    const base = name.toLowerCase().replace(/\s+/g, '_');
    let username = base;
    let count = 0;

    while (true) {
      const user = await this.prismaService.user.findUnique({
        where: { username },
      });

      if (!user) break;

      count++;
      username = `${username}_${count}`;
    }
    return username;
  }
}
