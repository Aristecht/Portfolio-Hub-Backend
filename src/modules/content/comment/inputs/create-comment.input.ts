import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  parentId?: string;
}
