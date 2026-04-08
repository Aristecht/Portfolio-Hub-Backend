import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CommnetCountModel {
  @Field()
  count: string;
}
