import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PopularTagsModel {
  @Field(() => String)
  tag: string;
  @Field(() => Int)
  count: number;
}
