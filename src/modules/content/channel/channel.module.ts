import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelResolver } from './channel.resolver';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  providers: [ChannelResolver, ChannelService],
  imports: [NotificationsModule],
})
export class ChannelModule {}
