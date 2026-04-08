import {
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '../../../../prisma/generated/prisma/client';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { UploadedFile as FileUpload } from '../../../shared/types/uploadedFile.types';
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('upload')
  @Authorization()
  @UseInterceptors(FileInterceptor('file'))
  async changeAvatar(
    @Authorized() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: FileUpload,
  ) {
    return await this.profileService.changeAvatar(user, file);
  }

  @Delete('remove')
  @Authorization()
  async removeAvatar(@Authorized() user: User) {
    return await this.profileService.removeAvatar(user);
  }
}
