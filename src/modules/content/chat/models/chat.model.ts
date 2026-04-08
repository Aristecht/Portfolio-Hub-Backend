import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UserChatInfoModel {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field()
  displayName: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  isOnline: boolean;

  @Field({ nullable: true })
  lastSeenAt?: Date;
}

@ObjectType()
export class MessageModel {
  @Field()
  id: string;

  @Field()
  chatId: string;

  @Field()
  senderId: string;

  @Field(() => UserChatInfoModel)
  sender: UserChatInfoModel;

  @Field()
  text: string;

  @Field()
  isRead: boolean;

  @Field()
  isEdited: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ChatModel {
  @Field()
  id: string;

  @Field(() => [UserChatInfoModel])
  members: UserChatInfoModel[];

  @Field(() => MessageModel, { nullable: true })
  lastMessage?: MessageModel;

  @Field(() => Int)
  unreadCount: number;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ChatMemberModel {
  @Field(() => UserChatInfoModel)
  user: UserChatInfoModel;
}

@ObjectType()
export class GetOrCreateChatModel {
  @Field()
  id: string;

  @Field(() => [ChatMemberModel])
  chatMembers: ChatMemberModel[];

  @Field(() => [MessageModel])
  messages: MessageModel[];
}

@ObjectType()
export class ChatMessagesMetaModel {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class ChatMessagesResponseModel {
  @Field(() => [MessageModel])
  data: MessageModel[];

  @Field(() => ChatMessagesMetaModel)
  meta: ChatMessagesMetaModel;
}
