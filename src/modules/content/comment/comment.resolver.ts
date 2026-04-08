import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommentService } from './comment.service';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { CreateCommentInput } from './inputs/create-comment.input';
import { CommentModel } from './models/comment.model';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { UpdateCommentInput } from './inputs/update-comment.input';
import { FilterCommentInput } from './inputs/filter-comment.input';
import { FilterCommentModel } from './models/filter-output.model';
import { GetRepliesInput } from './inputs/get-replies.input';
import { CommnetCountModel } from './models/count-comment.model';

@Resolver('Comment')
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  @Authorization()
  @Mutation(() => CommentModel, { name: 'createComment' })
  async createComment(
    @Authorized() user: User,
    @Args('data') input: CreateCommentInput,
  ) {
    return this.commentService.create(user, input);
  }

  @Authorization()
  @Mutation(() => CommentModel, { name: 'updateComment' })
  async updateComment(
    @Authorized() user: User,
    @Args('data') input: UpdateCommentInput,
  ) {
    return this.commentService.update(user, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'removeComment' })
  async removeComment(@Authorized() user: User, @Args('id') id: string) {
    return this.commentService.remove(user, id);
  }

  @Authorization()
  @Query(() => FilterCommentModel, { name: 'findCommentByProject' })
  async findCommentByProject(@Args('filter') filter: FilterCommentInput) {
    return this.commentService.findByProject(filter);
  }

  @Authorization()
  @Query(() => FilterCommentModel, { name: 'getRepliesComment' })
  async getRepliesComment(@Args('data') input: GetRepliesInput) {
    return this.commentService.getReplies(input);
  }

  @Authorization()
  @Query(() => CommnetCountModel, { name: 'getProjectCommentCount' })
  async getProjectCommentCount(@Args('projectId') projectId: string) {
    return this.commentService.getProjectCommentCount(projectId);
  }
}
