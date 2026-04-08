import { IsString, IsNumberString, IsOptional } from 'class-validator';

export class FreedomPayWebhookDto {
  @IsString()
  pg_order_id: string;

  @IsNumberString()
  pg_result: string;

  @IsNumberString()
  pg_amount: string;

  @IsString()
  pg_currency: string;

  @IsOptional()
  @IsString()
  pg_description?: string;

  @IsString()
  pg_sig: string;

  @IsOptional()
  @IsString()
  pg_payment_id?: string;

  @IsOptional()
  @IsString()
  pg_salt?: string;
}
