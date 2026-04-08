import { Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumResolver } from './album.resolver';
import { AlbumController } from './album.controller';

@Module({
  providers: [AlbumResolver, AlbumService],
  controllers: [AlbumController],
})
export class AlbumModule {}
