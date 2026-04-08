import { Module } from '@nestjs/common';
import { DonationService } from './donation.service';
import { DonationResolver } from './donation.resolver';
import { NotificationsModule } from '../notifications/notifications.module';
import { DonationController } from './donation.controller';
import { KaspiPayModule } from '../payments/kaspi-pay/kaspi-pay.module';
import { FreedomPayModule } from '../payments/freedom-pay/freedom-pay.module';

@Module({
  imports: [NotificationsModule, KaspiPayModule, FreedomPayModule],
  controllers: [DonationController],
  providers: [DonationResolver, DonationService],
  exports: [DonationService],
})
export class DonationModule {}
