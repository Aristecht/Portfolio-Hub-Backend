import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../../auth/account/models/user.model';

@ObjectType()
export class FollowModel {
  @Field(() => ID)
  id: string;

  @Field(() => UserModel, { nullable: true })
  follower?: UserModel;

  @Field(() => String, { nullable: true })
  followerId?: string;

  @Field(() => UserModel, { nullable: true })
  following?: UserModel;

  @Field(() => String, { nullable: true })
  followingId?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
