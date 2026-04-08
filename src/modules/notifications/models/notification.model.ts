import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NotificationsType } from '../../../../prisma/generated/prisma/client';
import { UserModel } from '../../auth/account/models/user.model';

registerEnumType(NotificationsType, { name: 'NotificationsType' });

@ObjectType()
export class NotificationModel {
  @Field(() => ID)
  id: string;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => String)
  message: string;

  @Field(() => NotificationsType)
  type: NotificationsType;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => String)
  userId: string;

  @Field(() => String, { nullable: true })
  actorId?: string;

  @Field(() => String, { nullable: true })
  projectId?: string;

  @Field(() => String, { nullable: true })
  albumId?: string;

  @Field(() => String, { nullable: true })
  commentId?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
