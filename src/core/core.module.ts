import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IS_DEV_ENV } from '../shared/utils/is-dev.util';
import { getGraphQLConfig } from './config/graphql.config';
import { RedisModule } from './redis/redis.module';
import { AccountModule } from '../modules/auth/account/account.module';
import { SessionModule } from '../modules/auth/session/session.module';
import { VerificationModule } from '../modules/auth/verification/verification.module';
import { MailModule } from '../modules/libs/mail/mail.module';
import { PasswordRecoveryModule } from '../modules/auth/password-recovery/password-recovery.module';
import { TotpModule } from '../modules/auth/totp/totp.module';
import { DeactivateModule } from '../modules/auth/deactivate/deactivate.module';
import { CronModule } from '../modules/cron/cron.module';
import { StorageModule } from '../modules/libs/storage/storage.module';
import { OauthModule } from '../modules/auth/oauth/oauth.module';
import { ProfileModule } from '../modules/auth/profile/profile.module';
import { AlbumModule } from '../modules/content/album/album.module';
import { ProjectModule } from '../modules/content/project/project.module';
import { CommentModule } from '../modules/content/comment/comment.module';
import { ChannelModule } from '../modules/content/channel/channel.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { FirebaseModule } from './firebase/firebase.module';
import { RawBodymiddleware } from '../shared/middlewares/raw-body.middleware';
import { DonationModule } from '../modules/donation/donation.module';
import { FreedomPayModule } from '../modules/payments/freedom-pay/freedom-pay.module';
import { KaspiPayModule } from '../modules/payments/kaspi-pay/kaspi-pay.module';
import { PayoutModule } from '../modules/payments/payout/payout.module';
import { ChatModule } from '../modules/content/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: !IS_DEV_ENV,
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 15 * 60 * 1000,
        limit: 5,
      },
      {
        name: 'strict',
        ttl: 60 * 60 * 1000,
        limit: 3,
      },
    ]),
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      useFactory: getGraphQLConfig,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    AccountModule,
    SessionModule,
    MailModule,
    CronModule,
    StorageModule,
    VerificationModule,
    PasswordRecoveryModule,
    TotpModule,
    DeactivateModule,
    OauthModule,
    ChatModule,
    ProfileModule,
    AlbumModule,
    ProjectModule,
    CommentModule,
    ChannelModule,
    NotificationsModule,
    FirebaseModule,
    DonationModule,
    FreedomPayModule,
    KaspiPayModule,
    PayoutModule,
  ],
})
export class CoreModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RawBodymiddleware)
      .forRoutes({ path: 'webhooks/stripe', method: RequestMethod.POST });
  }
}
