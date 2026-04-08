import { Field, InputType } from '@nestjs/graphql';
import { MediaType } from '../models/media.model';

@InputType()
export class CreateMediaInput {
  @Field()
  url: string;

  @Field(() => MediaType)
  mediaType: MediaType;
}
