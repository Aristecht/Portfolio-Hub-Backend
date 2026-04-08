import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DonationTier } from '../../../../prisma/generated/prisma/client';

@ObjectType()
export class DonationTierModel implements DonationTier {
  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => Int)
  amount: number;

  @Field(() => String)
  currency: string;

  @Field(() => Int)
  position: number;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => String)
  authorId: string;

  @Field(() => [String])
  benefits: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
