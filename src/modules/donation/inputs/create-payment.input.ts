import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../../../prisma/generated/prisma/enums';

registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

@InputType()
export class CreatePaymentInput {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  tierId: string;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
