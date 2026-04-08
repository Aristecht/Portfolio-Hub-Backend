import { InputType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class FilterCommentInput {
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

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  parentId?: string;
}
