import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateTagInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  tag: string;
}
