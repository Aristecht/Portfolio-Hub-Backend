import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DeviceToken } from '../../../../prisma/generated/prisma/client';

@ObjectType()
export class DevicesModel implements DeviceToken {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  deviceName: string;

  @Field(() => String)
  deviceType: string;

  @Field(() => String)
  token: string;

  @Field(() => String)
  userId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  lastUsedAt: Date;
}
