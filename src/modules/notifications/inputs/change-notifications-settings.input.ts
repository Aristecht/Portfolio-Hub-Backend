import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class ChangeNotificationsSettingsInput {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  siteNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;
}
