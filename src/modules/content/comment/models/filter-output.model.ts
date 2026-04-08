import { Field, ObjectType } from '@nestjs/graphql';
import { CommentMetaModel } from './meta.model';
import { CommentModel } from './comment.model';

@ObjectType()
export class FilterCommentModel {
  @Field(() => [CommentModel])
  data: CommentModel[];

  @Field(() => CommentMetaModel)
  meta: CommentMetaModel;
}
