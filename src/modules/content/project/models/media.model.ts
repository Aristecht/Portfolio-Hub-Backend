import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

registerEnumType(MediaType, { name: 'MediaType' });

@ObjectType()
export class MediaModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field()
  url: string;

  @Field(() => MediaType)
  mediaType: MediaType;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
