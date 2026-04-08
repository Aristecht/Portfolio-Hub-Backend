import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Authorization } from '../../../shared/decorators/authorization.decorator';
import { Authorized } from '../../../shared/decorators/authorized.decorator';
import type { User } from '../../../../prisma/generated/prisma/client';
import { getChatMessagesInput } from './inputs/get-chat-messages.input';
import { EditMessageInput } from './inputs/edit-message.input';
import {
  ChatMessagesResponseModel,
  ChatModel,
  GetOrCreateChatModel,
  MessageModel,
} from './models/chat.model';

@Resolver('Chat')
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Authorization()
  @Mutation(() => GetOrCreateChatModel, { name: 'getOrCreateChat' })
  async getOrCreateChat(
    @Authorized() user: User,
    @Args('userId') userId: string,
  ) {
    return this.chatService.getOrCreateChat(user, userId);
  }

  @Authorization()
  @Query(() => [ChatModel], { name: 'getMyChats' })
  async getMyChats(@Authorized() user: User) {
    return this.chatService.getUserChats(user.id);
  }

  @Authorization()
  @Query(() => ChatMessagesResponseModel, { name: 'getChatMessages' })
  async getChatMessages(
    @Authorized() user: User,
    @Args('data') input: getChatMessagesInput,
  ) {
    return this.chatService.getChatMessages(user.id, input);
  }

  @Authorization()
  @Mutation(() => Boolean, { name: 'deleteMessage' })
  async deleteMessage(
    @Authorized() user: User,
    @Args('messageId') messageId: string,
  ) {
    const result = await this.chatService.deleteMessage(user.id, messageId);
    this.chatGateway.server
      .to(`chat:${result.chatId}`)
      .emit('message:deleted', {
        messageId: result.messageId,
        chatId: result.chatId,
      });
    return true;
  }

  @Authorization()
  @Mutation(() => MessageModel, { name: 'editMessage' })
  async editMessage(
    @Authorized() user: User,
    @Args('data') input: EditMessageInput,
  ) {
    const updated = await this.chatService.editMessage(user.id, input);
    this.chatGateway.server
      .to(`chat:${updated.chatId}`)
      .emit('message:edited', {
        messageId: updated.id,
        chatId: updated.chatId,
        text: updated.text,
        isEdited: updated.isEdited,
      });
    return updated;
  }
}
