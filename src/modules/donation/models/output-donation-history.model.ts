import { Field, ObjectType } from '@nestjs/graphql';

import { DonationMetaModel } from './meta.model';
import { PaymentModel } from './payment.model';

@ObjectType()
export class OutputDonationHistoryModel {
  @Field(() => [PaymentModel])
  data: PaymentModel[];

  @Field(() => DonationMetaModel)
  meta: DonationMetaModel;
}
