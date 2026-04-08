import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class RegisterDeviceTokenInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field(() => String)
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  deviceType: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  deviceName?: string;
}
