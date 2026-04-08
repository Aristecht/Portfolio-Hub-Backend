import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserInfoModel {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;
}
