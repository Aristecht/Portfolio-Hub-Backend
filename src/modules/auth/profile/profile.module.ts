import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileResolver } from './profile.resolver';
import { ProfileController } from './profile.controller';

@Module({
  providers: [ProfileResolver, ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
