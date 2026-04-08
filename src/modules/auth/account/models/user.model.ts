import {
  Field,
  ID,
  ObjectType,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';
import { SocialLinkModel } from '../../profile/models/social-link.model';
import { NotificationModel } from '../../../notifications/models/notification.model';
import { NotificationSettingsModel } from '../../../notifications/models/notifications-settings.model';
import {
  PayoutMethod,
  Role,
  User,
} from '../../../../../prisma/generated/prisma/client';

registerEnumType(Role, { name: 'Role' });

@ObjectType()
export class UserModel implements User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;
  @Field(() => String)
  email: string;
  @Field(() => String)
  displayName: string;
  @Field(() => String)
  password: string;

  @Field(() => String, { nullable: true })
  avatar: string;
  @Field(() => String, { nullable: true })
  bio: string;
  @Field(() => String, { nullable: true })
  subscriptions: string;
  @Field(() => [String])
  albums: string[];
  @Field(() => [String])
  notifications: string[];
  @Field(() => [String])
  projectLikes: string[];
  @Field(() => [String])
  comments: string[];

  @Field(() => Boolean)
  isVerified: boolean;
  @Field(() => Boolean)
  isEmailVerified: boolean;
  @Field(() => Boolean)
  isTotpEnabled: boolean;
  @Field(() => String, { nullable: true })
  totpSecret: string;

  @Field(() => Boolean)
  isDeactivated: boolean;
  @Field(() => Date, { nullable: true })
  deactivatedAt: Date;

  @Field(() => [NotificationModel])
  notificaitons: NotificationModel[];

  @Field(() => NotificationSettingsModel)
  notificationsSettings: NotificationSettingsModel;

  @Field(() => String)
  bankCardHolder: string;

  @Field(() => String)
  bankCardNumber: string;

  @Field(() => String)
  bankIBAN: string;

  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => String)
  kaspiPhone: string;

  @Field(() => Date)
  lastSeenAt: Date;

  payoutMethod: PayoutMethod;

  @Field(() => String)
  pendingNewEmail: string;

  @Field(() => String)
  phoneNumber: string;

  @Field(() => [SocialLinkModel], { nullable: true })
  socialLink?: SocialLinkModel[];

  @Field(() => Role)
  role: Role;

  @Field(() => Date)
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
}
