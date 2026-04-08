import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProfileMetaModel {
  @Field()
  total: number;

  @Field()
  limit: number;

  @Field()
  page: number;

  @Field()
  totalPages: number;
}
