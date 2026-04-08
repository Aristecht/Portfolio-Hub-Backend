import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

@InputType()
export class UpdateCommentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
