import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SessionService } from './session.service';
import { UserModel } from '../account/models/user.model';
import { GqlContext } from '../../../shared/types/gql-context.types';
import { LoginInput } from './inputs/login.input';
import { UserAgent } from '../../../shared/decorators/user-agent.decorator';
import { SessionModel } from './models/session.model';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { AuthModel } from '../account/models/auth.model';
import { GqlThrottlerGuard } from '../../../shared/guards/gql-throttler.guard';

@Resolver()
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Query(() => [SessionModel], { name: 'findSessionByUser' })
  async findByUser(@Context() { req }: GqlContext) {
    return await this.sessionService.findByUser(req);
  }

  @Query(() => SessionModel, { name: 'findCurrentSession' })
  async findCurrent(@Context() { req }: GqlContext) {
    return await this.sessionService.findCurrent(req);
  }

  @Throttle({ auth: { limit: 75, ttl: 1 * 60 * 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => AuthModel, { name: 'loginUser' })
  async login(
    @Context() { req }: GqlContext,
    @Args('data') input: LoginInput,
    @UserAgent() userAgent: string,
  ) {
    return this.sessionService.login(req, input, userAgent);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'logoutUser' })
  async logout(@Context() { req }: GqlContext) {
    return this.sessionService.logout(req);
  }

  @Mutation(() => Boolean, { name: 'clearSessionCookie' })
  async clearSession(@Context() { req }: GqlContext) {
    return this.sessionService.clearCookie(req);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'removeSession' })
  async remove(@Context() { req }: GqlContext, @Args('id') id: string) {
    return this.sessionService.remove(req, id);
  }
}
