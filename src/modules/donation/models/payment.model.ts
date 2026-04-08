import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  PaymentMethod,
  PaymentsStatus,
  PayoutMethod,
} from '../../../../prisma/generated/prisma/client';
import { UserInfoModel } from '../../../shared/graphql/user-info.model';

registerEnumType(PaymentsStatus, { name: 'PaymentsStatus' });

registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

@ObjectType()
export class CreatePaymentResponseModel {
  @Field(() => String)
  paymentId: string;

  @Field(() => PaymentMethod)
  method: PaymentMethod;

  @Field(() => String)
  paymentUrl: string;

  @Field(() => String, { nullable: true })
  webUrl?: string;

  @Field(() => String, { nullable: true })
  qrCode?: string;

  @Field(() => Int)
  amount: number;

  @Field(() => String)
  expiresAt: string;
}

@ObjectType()
export class PaymentModel {
  @Field()
  id: string;

  @Field(() => UserInfoModel)
  donor: UserInfoModel;

  @Field(() => UserInfoModel)
  recipient: UserInfoModel;

  @Field(() => Int)
  amount: number;

  @Field()
  currency: string;

  @Field(() => PaymentsStatus)
  status: PaymentsStatus;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  message?: string;

  @Field()
  isAnonymous: boolean;

  @Field({ nullable: true })
  paidAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class KaspiPaymentResponseModel {
  @Field(() => String)
  paymentId: string;

  @Field(() => PaymentMethod)
  method: PaymentMethod;

  @Field(() => String)
  paymentUrl: string;

  @Field(() => String, { nullable: true })
  webUrl?: string;

  @Field(() => String, { nullable: true })
  qrCode?: string;

  @Field(() => Int)
  amount: number;

  @Field(() => Int)
  platformFee: number;

  @Field(() => String)
  expiresAt: string;
}

@ObjectType()
export class FreedomPaymentResponseModel {
  @Field(() => String)
  paymentId: string;

  @Field(() => PaymentMethod)
  method: PaymentMethod;

  @Field(() => String)
  paymentUrl: string;

  @Field(() => Int)
  amount: number;

  @Field(() => Int)
  platformFee: number;

  @Field(() => String)
  expiresAt: string;
}

@ObjectType()
export class EarnOnFeeModel {
  @Field(() => Int)
  totalReceived: number;

  @Field(() => Int)
  totalPlatformFee: number;
}

@ObjectType()
export class SetupPayoutResponseModel {
  @Field()
  success: boolean;

  @Field(() => PayoutMethod)
  method: PayoutMethod;
}

@ObjectType()
export class PayoutSettingsModel {
  @Field(() => PayoutMethod, { nullable: true })
  method?: PayoutMethod;

  @Field({ nullable: true })
  kaspiPhone?: string;

  @Field({ nullable: true })
  cardNumber?: string;

  @Field({ nullable: true })
  cardHolder?: string;

  @Field({ nullable: true })
  iban?: string;
}

@ObjectType()
export class BalanceModel {
  @Field(() => Int)
  availableBalance: number;

  @Field(() => Int)
  totalReceived: number;

  @Field(() => Int)
  totalPaidOut: number;
}

@ObjectType()
export class DonationStatsModel {
  @Field(() => Int)
  totalReceived: number;
  @Field(() => Int)
  totalGiven: number;
  @Field(() => Int)
  donationsReceivedCount: number;
  @Field(() => Int)
  donationsGivenCount: number;
  @Field(() => Int)
  uniqueDonorsCount: number;
}

@ObjectType()
export class RefundResponseModel {
  @Field()
  success: boolean;

  @Field()
  refundId: string;

  @Field(() => Int)
  amount: number;

  @Field()
  status: string;
}
