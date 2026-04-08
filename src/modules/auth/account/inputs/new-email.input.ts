import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class NewEmailInput {
  @Field(() => String)
  @IsUUID('4')
  @IsNotEmpty()
  token: string;
}
