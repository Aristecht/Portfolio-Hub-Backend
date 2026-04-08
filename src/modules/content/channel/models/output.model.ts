import { Field, ObjectType } from '@nestjs/graphql';

import { FollowModel } from './follow.model';
import { ProfileMetaModel } from './meta.model';

@ObjectType()
export class OutputFollowModel {
  @Field(() => [FollowModel])
  data: FollowModel[];

  @Field(() => ProfileMetaModel)
  meta: ProfileMetaModel;
}
