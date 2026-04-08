import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { UploadedFile as FileUpload } from '../../../shared/types/uploadedFile.types';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { ProjectService } from './project.service';
import { Args } from '@nestjs/graphql';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post(':id/images')
  @Authorization()
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImage(
    @Authorized() user: User,
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    files: FileUpload[],
  ) {
    return await this.projectService.uploadImages(user, id, files);
  }

  @Post(':id/video')
  @Authorization()
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @Authorized() user: User,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(mp4|mov|avi|webm)$/ }),
        ],
      }),
    )
    video: FileUpload,
  ) {
    return await this.projectService.uploadVideo(user, id, video);
  }

  @Post('media/:mediaId')
  @Authorization()
  async deleteMedia(
    @Authorized() user: User,
    @Param('mediaId') mediaId: string,
  ) {
    return await this.projectService.removeMedia(user, mediaId);
  }
}
