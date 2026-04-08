import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SocialLinkModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  url: string;

  @Field(() => Number)
  position: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
