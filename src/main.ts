// import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RedisStore } from 'connect-redis';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';

import { CoreModule } from './core/core.module';
import { RedisService } from './core/redis/redis.service';
import { ms } from './shared/utils/ms.util';
import { parseBoolean } from './shared/utils/parse-boolean.util';

async function bootstrap() {
  const app = await NestFactory.create(CoreModule, {
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const redis = app.get(RedisService);

  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: config.getOrThrow<string>('SESSION_NAME'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: config.get<string>('SESSION_DOMAIN') || undefined,
        maxAge: ms(config.getOrThrow<string | number>('SESSION_MAX_AGE')),
        httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
        secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
        sameSite: 'none',
      },
      store: new RedisStore({
        client: redis.client,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
      }),
    }),
  );

  app.use(passport.initialize());
  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}
bootstrap();
