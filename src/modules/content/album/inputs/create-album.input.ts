import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateAlbumInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(48)
  title: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
