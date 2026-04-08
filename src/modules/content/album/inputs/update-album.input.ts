import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class UpdateAlbumInput {
  @Field(() => String)
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(48)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
