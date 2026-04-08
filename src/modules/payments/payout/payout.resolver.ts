import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PayoutService } from './payout.service';
import {
  ApprovePayoutResponseModel,
  PayoutHistoryResponseModel,
  PayoutListResponseModel,
  ProcessPayoutResponseModel,
  RequestPayoutResponseModel,
} from './models/payout.model';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { HistoryPaymentInput } from '../../donation/inputs/page-limit.input';

@Resolver('Payout')
export class PayoutResolver {
  constructor(private readonly payoutService: PayoutService) {}

  @Authorization()
  @Mutation(() => RequestPayoutResponseModel, { name: 'requestPayout' })
  async requestPayout(@Authorized() user: User) {
    return await this.payoutService.requestPayout(user);
  }

  @Authorization('ADMIN')
  @Mutation(() => ProcessPayoutResponseModel, { name: 'startProcessingPayout' })
  async startProcessingPayout(@Args('payoutId') payoutId: string) {
    return await this.payoutService.startProcessingPayout(payoutId);
  }

  @Authorization('ADMIN')
  @Query(() => PayoutListResponseModel, { name: 'getPendingPayouts' })
  async getPendingPayouts(
    @Args('data', { nullable: true }) input?: HistoryPaymentInput,
  ) {
    return await this.payoutService.getPendingPayouts(input);
  }

  @Authorization('ADMIN')
  @Query(() => PayoutListResponseModel, { name: 'getAllPayouts' })
  async getAllPayouts(@Args('data') input: HistoryPaymentInput) {
    return await this.payoutService.getAllPayouts(input);
  }

  @Authorization('ADMIN')
  @Mutation(() => ApprovePayoutResponseModel, { name: 'approvePayout' })
  async approvePayout(
    @Args('payoutId') payoutId: string,
    @Args('transactionId') transactionId?: string,
  ) {
    return await this.payoutService.approvePayout(payoutId, transactionId);
  }

  @Authorization('ADMIN')
  @Mutation(() => Boolean, { name: 'rejectPayout' })
  async rejectPayout(
    @Args('payoutId') payoutId: string,
    @Args('reason') reason: string,
  ) {
    return await this.payoutService.rejectPayout(payoutId, reason);
  }

  @Authorization()
  @Query(() => PayoutHistoryResponseModel, { name: 'getPayoutHistory' })
  async getPayoutHistory(
    @Authorized() user: User,
    @Args('data', { nullable: true }) input?: HistoryPaymentInput,
  ) {
    return await this.payoutService.getPayoutHistory(user, input);
  }
}
