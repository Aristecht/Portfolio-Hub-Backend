import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationResolver } from './verification.resolver';
import { MailModule } from '../../libs/mail/mail.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [MailModule, NotificationsModule],
  providers: [VerificationResolver, VerificationService],
})
export class VerificationModule {}
