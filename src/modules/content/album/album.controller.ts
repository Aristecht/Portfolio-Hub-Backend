import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { UploadedFile as FileUpload } from '../../../shared/types/uploadedFile.types';
import { AlbumService } from './album.service';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';

@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post('upload')
  @Authorization()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file: FileUpload,
  ) {
    return await this.albumService.uploadImage(file);
  }

  @Delete('remove')
  @Authorization()
  async removeImage(
    @Authorized() user: User,
    @Body('albumId') albumId: string,
  ) {
    return this.albumService.removeImage(user, albumId);
  }
}
