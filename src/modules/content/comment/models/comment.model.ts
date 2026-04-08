import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserInfoCommentModel {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class CommentModel {
  @Field()
  id: string;

  @Field()
  text: string;

  @Field(() => UserInfoCommentModel)
  user: UserInfoCommentModel;

  @Field()
  userId: string;

  @Field()
  projectId: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field(() => Int)
  repliesCount: number;

  @Field(() => [CommentModel], { nullable: true })
  replies?: CommentModel[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
