import { Module } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { PayoutResolver } from './payout.resolver';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  providers: [PayoutResolver, PayoutService],
  imports: [NotificationsModule],
})
export class PayoutModule {}
