import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NotificationMetaModel {
  @Field()
  total: number;

  @Field()
  limit: number;

  @Field()
  page: number;

  @Field()
  totalPages: number;
}
