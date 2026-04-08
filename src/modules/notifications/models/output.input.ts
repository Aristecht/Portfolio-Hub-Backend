import { Field, ObjectType } from '@nestjs/graphql';

import { NotificationMetaModel } from './meta.model';
import { NotificationModel } from './notification.model';

@ObjectType()
export class OutputNotificationModel {
  @Field(() => [NotificationModel])
  data: NotificationModel[];

  @Field(() => NotificationMetaModel)
  meta: NotificationMetaModel;
}
