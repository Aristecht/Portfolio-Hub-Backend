import { InputType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  IsInt,
  Max,
} from 'class-validator';

@InputType()
export class GetRepliesInput {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  commentId: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Max(100)
  @Min(1)
  limit?: number;
}
