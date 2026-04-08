import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  providers: [CommentResolver, CommentService],
  imports: [NotificationsModule],
})
export class CommentModule {}
