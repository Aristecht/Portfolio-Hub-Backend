import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AlbumProjectMediaModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  url: string;

  @Field(() => String)
  mediaType: string;
}

@ObjectType()
export class AlbumProjectModel {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => [String])
  tags: string[];

  @Field(() => Boolean)
  isPublic: boolean;

  @Field(() => Int)
  likes: number;

  @Field(() => Int)
  commentsCount: number;

  @Field(() => [AlbumProjectMediaModel])
  media: AlbumProjectMediaModel[];

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class AlbumUserModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  avatar: string;
}

@ObjectType()
export class AlbumModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => Boolean)
  isPublic: boolean;

  @Field(() => String)
  thumbnailUrl: string;

  @Field(() => AlbumUserModel, { nullable: true })
  user?: AlbumUserModel;

  @Field(() => [AlbumProjectModel], { nullable: true })
  projects?: AlbumProjectModel[];

  @Field(() => Int, { nullable: true })
  projectCount?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
