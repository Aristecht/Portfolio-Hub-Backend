import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { MediaModel } from './media.model';
import { CommentModel } from '../../comment/models/comment.model';
import { AlbumModel } from '../../album/models/album.model';

@ObjectType()
export class ProjectLikedUserModel {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;
}

@ObjectType()
export class ProjectLikeModel {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => ProjectLikedUserModel)
  user: ProjectLikedUserModel;
}

@ObjectType()
export class AlbumUserModell {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field(() => Int)
  followers: number;

  @Field(() => Boolean, { nullable: true })
  isFollowing?: boolean;
}
@ObjectType()
export class FullModelProject {
  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => AlbumUserModell)
  user: AlbumUserModell;
}

@ObjectType()
export class ProjectModel {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field(() => [String])
  tags: string[];

  @Field({ nullable: true })
  description?: string;

  @Field()
  albumId: string;

  @Field(() => [MediaModel])
  media: MediaModel[];

  @Field(() => Boolean)
  isPublic: boolean;

  @Field(() => Int)
  likes: number;

  @Field(() => Int)
  views: number;

  @Field(() => Int)
  commentsCount: number;

  @Field(() => FullModelProject)
  album: FullModelProject;

  @Field(() => Boolean, { nullable: true })
  isLiked?: boolean;

  @Field(() => [ProjectLikeModel], { nullable: true })
  likedBy?: ProjectLikeModel[];

  @Field()
  createdAt: Date;

  @Field(() => [CommentModel])
  comments: CommentModel[];

  @Field()
  updatedAt: Date;
}
