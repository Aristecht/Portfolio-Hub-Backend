import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from './profile.service';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { FileValidationType } from '../../../shared/pipes/file-validation.pipe';
import { ChangeProfileInput } from './inputs/change-profile-info.input';
import {
  SocialLinkInput,
  SocialLinkOrderInput,
} from './inputs/social-link.input';
import { SocialLinkModel } from './models/social-link.model';

@Resolver('Profile')
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Authorization()
  @Mutation(() => Boolean, { name: 'changeProfileInfo' })
  async changeProfileInfo(
    @Authorized() user: User,
    @Args('data') input: ChangeProfileInput,
  ) {
    return this.profileService.changeProfileInfo(user, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'createSocialLink' })
  async createSocialLink(
    @Authorized() user: User,
    @Args('data') input: SocialLinkInput,
  ) {
    return this.profileService.createSocialLink(user, input);
  }

  @Authorization()
  @Query(() => [SocialLinkModel], { name: 'findSocialMedia' })
  async findSocialMedia(@Authorized() user: User) {
    return this.profileService.findSocialMedia(user);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'updateSocialLink' })
  async updateSocialLink(
    @Args('id') id: string,
    @Args('data') input: SocialLinkInput,
  ) {
    return this.profileService.updateSocialLink(id, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'removeSocialLink' })
  async removeSocialLink(@Args('id') id: string) {
    return this.profileService.removeSocialLink(id);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'reorderSocialLinks' })
  async reorderSocialLinks(
    @Authorized() user: User,
    @Args('list', { type: () => [SocialLinkOrderInput] })
    list: SocialLinkOrderInput[],
  ) {
    return this.profileService.reorderSocialLinks(user, list);
  }
}
