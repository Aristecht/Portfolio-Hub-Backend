import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Request } from 'express';

import { type User } from '../../../prisma/generated/prisma/client';
import { type SessionMetadata } from '../types/session-metadata.types';

export function saveSession(
  req: Request,
  user: User,
  metadata: SessionMetadata,
) {
  return new Promise((resolve, reject) => {
    if (!user) {
      return reject(
        new InternalServerErrorException(
          'User object is null, cannot save session.',
        ),
      );
    }
    req.session.createdAt = new Date();
    req.session.userId = user.id;
    req.session.metadata = metadata;

    req.session.save(err => {
      if (err) {
        // Log underlying store error for debugging
        // eslint-disable-next-line no-console
        return reject(
          new InternalServerErrorException(
            `Не удалось сохранить сессию: ${err?.message ?? 'unknown error'}`,
          ),
        );
      }
      resolve(user);
    });
  });
}

export function destroySession(req: Request, configService: ConfigService) {
  return new Promise((resolve, reject) => {
    req.session.destroy(err => {
      if (err) {
        return reject(
          new InternalServerErrorException('Не удалось завершить сессию'),
        );
      }
      req.res.clearCookie(configService.getOrThrow<string>('SESSION_NAME'));
      resolve(true);
    });
  });
}
