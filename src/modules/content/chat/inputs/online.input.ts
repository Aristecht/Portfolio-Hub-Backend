import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateOnlineStatusInput {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Field(() => Boolean)
  @IsBoolean()
  isOnline: boolean;
}
