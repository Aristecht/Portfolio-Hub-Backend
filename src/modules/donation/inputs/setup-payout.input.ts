import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PayoutMethod } from '../../../../prisma/generated/prisma/enums';

registerEnumType(PayoutMethod, { name: 'PayoutMethod' });

@InputType()
export class SetupPayoutInput {
  @Field(() => PayoutMethod)
  @IsEnum(PayoutMethod)
  @IsNotEmpty()
  method: PayoutMethod;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  kaspiPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  cardHolder?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  iban?: string;
}
