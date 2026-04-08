import { InputType, Field } from '@nestjs/graphql';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class RefundPaymentInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
