import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(6)
  oldPassword?: string;
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
