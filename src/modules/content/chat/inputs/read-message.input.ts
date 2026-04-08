import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class ReadMessageInput {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  chatId: string;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  messageId: string;
}
