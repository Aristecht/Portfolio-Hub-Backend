import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProjectMetaModel {
  @Field()
  total: number;

  @Field()
  limit: number;

  @Field()
  page: number;

  @Field()
  totalPages: number;
}
