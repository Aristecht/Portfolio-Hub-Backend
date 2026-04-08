import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { DeactivateService } from './deactivate.service';
import { UserAgent } from '../../../shared/decorators/user-agent.decorator';
import { DeactivateAccountInput } from './inputs/deactivate-account.input';
import { GqlContext } from '../../../shared/types/gql-context.types';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { AuthModel } from '../account/models/auth.model';
import { Authorization } from '../../../shared/decorators/authorization.decorator';

@Resolver('Deactivate')
export class DeactivateResolver {
  constructor(private readonly deactivateService: DeactivateService) {}

  @Authorization()
  @Mutation(() => AuthModel, { name: 'deactivateAccount' })
  async deactivate(
    @Context() { req }: GqlContext,
    @Args('data') input: DeactivateAccountInput,
    @Authorized() user: User,
    @UserAgent() userAgent: string,
  ) {
    return this.deactivateService.deactivate(req, input, user, userAgent);
  }
}
