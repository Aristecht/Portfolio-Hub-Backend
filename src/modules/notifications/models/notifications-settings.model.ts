import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../auth/account/models/user.model';
import { NotificationsSettings } from '../../../../prisma/generated/prisma/client';

@ObjectType()
export class NotificationSettingsModel implements NotificationsSettings {
  @Field(() => ID)
  id: string;

  @Field(() => Boolean)
  siteNotifications: boolean;

  @Field(() => Boolean)
  pushNotifications: boolean;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => String)
  userId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class changeNotificationSettingsModel {
  @Field(() => NotificationSettingsModel)
  notificationSettings: NotificationSettingsModel;
}
