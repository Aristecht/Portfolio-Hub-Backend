import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProjectService } from './project.service';
import { ProjectModel } from './models/project.model';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { CreateProjectInput } from './inputs/create-project.input';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { PopularTagsModel } from '../project/models/popular-tags.model';
import { CreateTagInput } from '../project/inputs/add-tag.input';
import { RemoveTagInput } from '../project/inputs/remove-tag.input';
import { UpdateProjectInput } from './inputs/update-project.input';
import { FilterProjectInput } from './inputs/filter-project.input';
import { FilterProjectModel } from './models/filter-project.model';
import { ProjectLikeModel } from './models/project.model';

@Resolver('Project')
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Authorization()
  @Mutation(() => String, { name: 'createDraftProject' })
  async createDraftProject(
    @Authorized() user: User,
    @Args('albumId') albumId: string,
  ) {
    return await this.projectService.createDraftProject(user, albumId);
  }

  @Authorization()
  @Mutation(() => ProjectModel, { name: 'createProject' })
  async createProject(
    @Authorized() user: User,
    @Args('data') input: CreateProjectInput,
  ) {
    return await this.projectService.createProject(user, input);
  }

  @Authorization()
  @Mutation(() => ProjectModel, { name: 'updateProject' })
  async updateProject(
    @Authorized() user: User,
    @Args('data') input: UpdateProjectInput,
  ) {
    return await this.projectService.updateProject(user, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'deleteProject' })
  async removeProject(
    @Authorized() user: User,
    @Args('projectId') projectId: string,
  ) {
    return await this.projectService.removeProject(user, projectId);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'deleteDraftProject' })
  async deleteDraftProject(
    @Authorized() user: User,
    @Args('projectId') projectId: string,
  ) {
    return await this.projectService.removeDraftProject(user, projectId);
  }

  @Authorization()
  @Query(() => ProjectModel, { name: 'findOneProject' })
  async findOne(
    @Args('projectId') projectId: string,
    @Authorized() user?: User,
  ) {
    return await this.projectService.findOne(projectId, user?.id);
  }

  @Mutation(() => Int, { name: 'incrementProjectView' })
  async incrementProjectView(@Args('projectId') projectId: string) {
    return await this.projectService.incrementView(projectId);
  }

  @Authorization()
  @Query(() => FilterProjectModel, { name: 'findAllProject' })
  async findAll(
    @Args('filter') filter: FilterProjectInput,
    @Authorized() user?: User,
  ) {
    return await this.projectService.findAll(filter, user?.id);
  }

  @Authorization()
  @Mutation(() => ProjectModel, { name: 'toggleLike' })
  async toggleLike(
    @Authorized() user: User,
    @Args('projectId') projectId: string,
  ) {
    return await this.projectService.toggleLike(user, projectId);
  }

  @Query(() => [ProjectLikeModel], { name: 'projectLikes' })
  @Authorization()
  async projectLikes(@Args('projectId') projectId: string) {
    return await this.projectService.getLikes(projectId);
  }

  @Authorization()
  @Mutation(() => ProjectModel, { name: 'setProjectLike' })
  async setProjectLike(
    @Authorized() user: User,
    @Args('projectId') projectId: string,
    @Args('like') like: boolean,
  ) {
    return await this.projectService.setLike(user, projectId, like);
  }

  @Mutation(() => Boolean, { name: 'addTag' })
  @Authorization()
  async addTag(@Authorized() user: User, @Args('data') input: CreateTagInput) {
    return this.projectService.addTag(user, input);
  }

  @Mutation(() => Boolean, { name: 'removeTag' })
  @Authorization()
  async removeTag(
    @Authorized() user: User,
    @Args('data') input: RemoveTagInput,
  ) {
    return this.projectService.removeTag(user, input);
  }

  @Query(() => [PopularTagsModel], { name: 'popularTags' })
  @Authorization()
  async popularTags(
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ) {
    return this.projectService.popularTags(limit);
  }
}
