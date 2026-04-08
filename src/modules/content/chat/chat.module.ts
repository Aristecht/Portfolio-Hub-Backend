import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { ChatGateway } from './chat.gateway';

@Module({
  providers: [ChatResolver, ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
