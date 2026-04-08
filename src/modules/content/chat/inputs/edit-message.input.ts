import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class EditMessageInput {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  messageId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  newText: string;
}
