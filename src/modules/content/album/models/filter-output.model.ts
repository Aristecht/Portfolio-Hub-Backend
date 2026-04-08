import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AlbumMetaModel } from './meta.model';
import { AlbumModel } from './album.model';

@ObjectType()
export class FilterAlbumModel {
  @Field(() => [AlbumModel])
  data: AlbumModel[];

  @Field(() => AlbumMetaModel)
  meta: AlbumMetaModel;
}
