import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectResolver } from './project.resolver';
import { ProjectController } from './project.controller';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  providers: [ProjectResolver, ProjectService],
  controllers: [ProjectController],
  imports: [NotificationsModule],
})
export class ProjectModule {}
