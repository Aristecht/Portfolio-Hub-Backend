import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { MediaModel } from '../../project/models/media.model';

@ObjectType()
export class ChannelSocialLinkModel {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  url: string;

  @Field(() => Int)
  position: number;
}

@ObjectType()
export class AlbumPreviewModel {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  thumbnailUrl: string;

  @Field(() => Int)
  projectsCount: number;

  @Field()
  isPublic: boolean;
}

@ObjectType()
export class ProjectPreviewModel {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  tags: string[];

  @Field()
  thumbnailUrl: string;

  @Field(() => Int)
  likes: number;

  @Field(() => [MediaModel])
  media: MediaModel[];

  @Field(() => Boolean)
  isPublic: Boolean;

  @Field(() => Int)
  views: number;

  @Field(() => Int)
  commentsCount: number;
}

@ObjectType()
export class ChannelStatsModel {
  @Field(() => Int)
  followersCount: number;

  @Field(() => Int)
  followingCount: number;

  @Field(() => Int)
  albumsCount: number;

  @Field(() => Int)
  projectsCount: number;

  @Field(() => Int)
  totalLikes: number;

  @Field(() => Int)
  totalViews: number;
}

@ObjectType()
export class ChannelModel {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field()
  displayName: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => Boolean)
  isFollowing: boolean;

  @Field(() => ChannelStatsModel)
  stats: ChannelStatsModel;

  @Field(() => [ChannelSocialLinkModel])
  socialLinks: ChannelSocialLinkModel[];

  @Field(() => [AlbumPreviewModel])
  albums: AlbumPreviewModel[];

  @Field(() => [ProjectPreviewModel])
  projects: ProjectPreviewModel[];

  @Field(() => Date)
  createdAt: Date;
}
