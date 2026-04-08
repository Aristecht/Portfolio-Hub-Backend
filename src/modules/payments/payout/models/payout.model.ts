import { registerEnumType } from '@nestjs/graphql';

import {
  PayoutMethod,
  PayoutStatus,
} from '../../../../../prisma/generated/prisma/enums';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

registerEnumType(PayoutStatus, {
  name: 'PayoutStatus',
});

registerEnumType(PayoutMethod, {
  name: 'PayoutMethod',
});

@ObjectType()
export class PayoutDetailsGQL {
  @Field(() => PayoutMethod)
  method: PayoutMethod;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  card?: string;

  @Field({ nullable: true })
  iban?: string;
}

@ObjectType()
export class RequestPayoutResponseModel {
  @Field()
  payoutId: string;

  @Field(() => Int)
  amount: number;

  @Field(() => PayoutMethod)
  method: PayoutMethod;

  @Field(() => PayoutStatus)
  status: PayoutStatus;

  @Field()
  message: string;
}

@ObjectType()
export class ProcessPayoutResponseModel {
  @Field()
  success: boolean;

  @Field(() => PayoutStatus)
  status: PayoutStatus;
}

@ObjectType()
export class PayoutUserInfoModel {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;
}

@ObjectType()
export class PayoutItemModel {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  amount: number;

  @Field(() => PayoutStatus)
  status: PayoutStatus;

  @Field()
  createdAt: Date;

  @Field(() => PayoutUserInfoModel)
  user: PayoutUserInfoModel;

  @Field(() => PayoutDetailsGQL, { nullable: true })
  payoutDetails?: PayoutDetailsGQL;
}

@ObjectType()
export class PaginationMeta {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class PayoutListResponseModel {
  @Field(() => [PayoutItemModel])
  data: PayoutItemModel[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}

@ObjectType()
export class ApprovePayoutResponseModel {
  @Field()
  success: boolean;

  @Field()
  payoutId: string;

  @Field(() => Int)
  amount: number;
}

@ObjectType()
export class PayoutHistoryItemModel {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  amount: number;

  @Field(() => PayoutStatus)
  status: PayoutStatus;

  @Field(() => PayoutMethod)
  method: PayoutMethod;

  @Field({ nullable: true })
  transactionId?: string;

  @Field({ nullable: true })
  failureReason?: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  processedAt?: Date;
}

@ObjectType()
export class PayoutHistoryResponseModel {
  @Field(() => [PayoutHistoryItemModel])
  data: PayoutHistoryItemModel[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
