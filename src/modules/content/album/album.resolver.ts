import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AlbumService } from './album.service';
import { AlbumModel } from './models/album.model';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { CreateAlbumInput } from './inputs/create-album.input';
import { UpdateAlbumInput } from './inputs/update-album.input';
import { FilterAlbumInput } from './inputs/filter-albums.input';
import { FilterAlbumModel } from './models/filter-output.model';

@Resolver('Album')
export class AlbumResolver {
  constructor(private readonly albumService: AlbumService) {}

  @Mutation(() => AlbumModel, { name: 'createAlbum' })
  @Authorization()
  async createAlbum(
    @Authorized() user: User,
    @Args('data') input: CreateAlbumInput,
  ) {
    return this.albumService.createAlbum(user, input);
  }

  @Mutation(() => AlbumModel, { name: 'updateAlbum' })
  @Authorization()
  async updateAlbum(
    @Authorized() user: User,
    @Args('data') input: UpdateAlbumInput,
  ) {
    return this.albumService.updateAlbum(user, input);
  }

  @Mutation(() => Boolean, { name: 'removeAlbum' })
  @Authorization()
  async removeAlbum(@Authorized() user: User, @Args('id') id: string) {
    return this.albumService.removeAlbum(user, id);
  }

  @Query(() => FilterAlbumModel, { name: 'findAllAlbums' })
  @Authorization()
  async findAllAlbums(@Args('filter') filter: FilterAlbumInput) {
    return this.albumService.findAllAlbums(filter);
  }

  @Query(() => AlbumModel, { name: 'findOne' })
  @Authorization()
  async findOne(@Authorized() user: User, @Args('id') id: string) {
    return this.albumService.findOne(user, id);
  }
}
