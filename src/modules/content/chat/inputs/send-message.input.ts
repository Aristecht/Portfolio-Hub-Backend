import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  chatId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  text: string;
}
