import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PasswordRecoveryService } from './password-recovery.service';
import { GqlContext } from '../../../shared/types/gql-context.types';
import { ResetPasswordInput } from './inputs/reset-password.input';
import { UserAgent } from '../../../shared/decorators/user-agent.decorator';
import { NewPasswordInput } from './inputs/new-password.input';
import { GqlThrottlerGuard } from '../../../shared/guards/gql-throttler.guard';

@Resolver()
export class PasswordRecoveryResolver {
  constructor(
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @Throttle({ strict: { limit: 20, ttl: 60 * 60 * 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => Boolean, { name: 'resetPassword' })
  async resetPassword(
    @Context() { req }: GqlContext,
    @Args('data') input: ResetPasswordInput,
    @UserAgent() userAgent: string,
  ) {
    return this.passwordRecoveryService.resetPassword(req, input, userAgent);
  }

  @Mutation(() => Boolean, { name: 'newPassword' })
  async newPassword(@Args('data') input: NewPasswordInput) {
    return this.passwordRecoveryService.newPassword(input);
  }
}
