import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';

@InputType()
export class DeactivateAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @ValidateIf(o => o.pin !== undefined && o.pin !== '')
  @Length(6, 6)
  pin?: string;
}
