import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChannelService } from './channel.service';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import { ChannelModel } from './models/channel.model';
import type { User } from '../../../../prisma/generated/prisma/client';
import { FindFollowers } from './inputs/find-followers.input';
import { OutputFollowModel } from './models/output.model';
import { FindFollowings } from './inputs/find-followings.input';
import { Authorization } from '../../../shared/decorators/authorization.decorator';

@Resolver('Channel')
export class ChannelResolver {
  constructor(private readonly channelService: ChannelService) {}

  @Authorization()
  @Query(() => ChannelModel, { name: 'getChannel' })
  async getChannel(
    @Args('username') username: string,
    @Authorized() currentUser?: User,
  ) {
    return await this.channelService.getChannel(username, currentUser?.id);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'followUser' })
  async follow(@Authorized() user: User, @Args('channelId') channelId: string) {
    return await this.channelService.follow(user, channelId);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'unfollowUser' })
  async unfollow(
    @Authorized() user: User,
    @Args('channelId') channelId: string,
  ) {
    return await this.channelService.unfollow(user, channelId);
  }

  @Query(() => OutputFollowModel, { name: 'findFollowers' })
  async findFollowers(@Args('data') input: FindFollowers) {
    return await this.channelService.findMyFollowers(input);
  }

  @Query(() => OutputFollowModel, { name: 'findFollowings' })
  async findFollowings(@Args('data') input: FindFollowings) {
    return await this.channelService.findMyFollowings(input);
  }
}
