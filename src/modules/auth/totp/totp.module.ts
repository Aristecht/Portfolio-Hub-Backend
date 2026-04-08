import { Module } from '@nestjs/common';
import { TotpService } from './totp.service';
import { TotpResolver } from './totp.resolver';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  providers: [TotpResolver, TotpService],
  imports: [NotificationsModule],
})
export class TotpModule {}
