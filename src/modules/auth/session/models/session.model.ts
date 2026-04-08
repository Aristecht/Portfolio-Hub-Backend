import { Field, ID, ObjectType } from '@nestjs/graphql';
import type {
  DeviceInfo,
  LocationInfo,
  SessionMetadata,
} from '../../../../shared/types/session-metadata.types';

@ObjectType()
export class LocationModel implements LocationInfo {
  @Field(() => String)
  country: string;
  @Field(() => String)
  city: string;
  @Field(() => Number)
  latitude: number;
  @Field(() => Number)
  longtitude: number;
}
@ObjectType()
export class DeviceModel implements DeviceInfo {
  @Field(() => String)
  browser: string;
  @Field(() => String)
  os: string;
  @Field(() => String)
  type: string;
}
@ObjectType()
export class SessionMetadataModel implements SessionMetadata {
  @Field(() => DeviceModel)
  device: DeviceModel;
  @Field(() => LocationModel)
  location: LocationModel;
  @Field(() => String)
  ip: string;
}
@ObjectType()
export class SessionModel {
  @Field(() => ID)
  id: string;
  @Field(() => String)
  userId: string;
  @Field(() => String)
  createdAt: string;
  @Field()
  isCurrent: boolean;

  @Field(() => SessionMetadataModel, { nullable: true })
  metadata: SessionMetadataModel;
}
