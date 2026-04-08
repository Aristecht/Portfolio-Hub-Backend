import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DonationService } from './donation.service';
import {
  BalanceModel,
  CreatePaymentResponseModel,
  DonationStatsModel,
  EarnOnFeeModel,
  PaymentModel,
  PayoutSettingsModel,
  RefundResponseModel,
  SetupPayoutResponseModel,
} from './models/payment.model';
import { DonationTierModel } from './models/donation-tier.model';
import { Authorized } from '../../shared/decorators/authorized.decorator';
import type { User } from '../../../prisma/generated/prisma/client';
import { CreateDonationTierInput } from './inputs/create-donation-tier.input';
import { Authorization } from '../../shared/decorators/authorization.decorator';
import { UpdateDonationTierInput } from './inputs/update-donation-tier.input';
import { CreatePaymentInput } from './inputs/create-payment.input';
import { RefundPaymentInput } from './inputs/refund-payement.input';
import { OutputDonationHistoryModel } from './models/output-donation-history.model';
import { HistoryPaymentInput } from './inputs/page-limit.input';
import { SetupPayoutInput } from './inputs/setup-payout.input';

@Resolver('Donation')
export class DonationResolver {
  constructor(private readonly donationService: DonationService) {}

  @Authorization()
  @Mutation(() => DonationTierModel, { name: 'createDonationTier' })
  async createDonationTier(
    @Authorized() user: User,
    @Args('data') input: CreateDonationTierInput,
  ) {
    return await this.donationService.createTier(user, input);
  }

  @Authorization()
  @Mutation(() => DonationTierModel, { name: 'updateDonationTier' })
  async updateDonationTier(
    @Authorized() user: User,
    @Args('data') input: UpdateDonationTierInput,
  ) {
    return await this.donationService.updateTier(user, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'deleteDonationTier' })
  async deleteDonationTier(
    @Authorized() user: User,
    @Args('tierId') tierId: string,
  ) {
    return await this.donationService.removeTier(user, tierId);
  }

  @Authorization()
  @Query(() => [DonationTierModel], { name: 'getTiersByAuthor' })
  async getTiersByAuthor(@Args('username') username: string) {
    return await this.donationService.getTiersByAuthor(username);
  }

  @Authorization()
  @Mutation(() => CreatePaymentResponseModel, { name: 'createPayment' })
  async createPayment(
    @Authorized() user: User,
    @Args('data') input: CreatePaymentInput,
  ) {
    return await this.donationService.createPayment(user, input);
  }

  @Authorization()
  @Mutation(() => RefundResponseModel, { name: 'createRefund' })
  async createRefund(
    @Authorized() user: User,
    @Args('data') input: RefundPaymentInput,
  ) {
    return await this.donationService.createRefund(user, input);
  }

  @Authorization()
  @Query(() => OutputDonationHistoryModel, { name: 'getPaymentHistory' })
  async getPaymentHistory(
    @Authorized() user: User,
    @Args('data') input?: HistoryPaymentInput,
  ) {
    return await this.donationService.getPaymentHistory(user, input);
  }

  @Authorization()
  @Query(() => BalanceModel, { name: 'getBalance' })
  async getBalance(@Authorized() user: User) {
    return await this.donationService.getBalance(user);
  }

  @Authorization()
  @Query(() => DonationStatsModel, { name: 'getDonationStats' })
  async getDonationStats(@Authorized() user: User) {
    return await this.donationService.getDonationStats(user);
  }

  @Authorization()
  @Mutation(() => SetupPayoutResponseModel, { name: 'setupPayoutMethod' })
  async setupPayoutMethod(
    @Authorized() user: User,
    @Args('data') input: SetupPayoutInput,
  ) {
    return await this.donationService.setupPayoutMethod(user, input);
  }

  @Authorization()
  @Mutation(() => SetupPayoutResponseModel, { name: 'updatePayoutMethod' })
  async updatePayoutMethod(
    @Authorized() user: User,
    @Args('data') input: SetupPayoutInput,
  ) {
    return await this.donationService.updatePayoutMethod(user, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'removePayoutMethod' })
  async removePayoutMethod(@Authorized() user: User) {
    return await this.donationService.removePayoutMethod(user);
  }

  @Authorization()
  @Query(() => PayoutSettingsModel, { name: 'getPayoutSettings' })
  async getPayoutSettings(@Authorized() user: User) {
    return await this.donationService.getPayoutSettings(user);
  }

  @Authorization()
  @Query(() => EarnOnFeeModel, { name: 'getEarnOnFee' })
  async getEarnOnFee() {
    return await this.donationService.getEarnOnFee();
  }
}
