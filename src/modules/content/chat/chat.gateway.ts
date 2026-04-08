import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../../../shared/guards/ws-auth.guard';
import { NotificationsService } from '../../notifications/notifications.service';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGIN || 3000,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly userSockets = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      if (!userId) {
        client.disconnect();
        return;
      }

      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      await this.chatService.setUserOnline(userId, true);

      const chats = await this.chatService.getUserChats(userId);
      chats.forEach(chat => {
        client.join(`chat:${chat.id}`);
      });

      this.server.emit('user:online', { userId });

      const onlineUserIds = Array.from(this.userSockets.keys());
      client.emit('users:online', { userIds: onlineUserIds });

      console.log(`User ${userId} connected`);
    } catch (error) {
      console.error('Connection error', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      this.userSockets.delete(userId);

      await this.chatService.setUserOnline(userId, false);

      this.server.emit('user:offline', { userId });

      console.log(`User ${userId} disconnected`);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; text: string },
  ) {
    const userId = client.data.userId;
    const { chatId, text } = data;

    try {
      const message = await this.chatService.sendMessage(chatId, text, userId);

      this.server.to(`chat:${chatId}`).emit('message:new', {
        userId,
        message: {
          id: message.id,
          chatId,
          text: message.text,
          senderId: message.senderId,
          sender: message.sender,
          createdAt: message.createdAt,
          isRead: false,
        },
      });

      client.emit('message:sent', { messageId: message.id });

      const memberIds = await this.chatService.getChatMemberIds(chatId);
      const offlineMemberIds = memberIds.filter(
        id => id !== userId && !this.userSockets.has(id),
      );
      for (const recipientId of offlineMemberIds) {
        await this.notificationsService.sendChatMessagePushNotification(
          recipientId,
          message.sender.displayName,
          message.text,
          chatId,
        );
      }
    } catch (error: any) {
      client.emit('message:error', { error: error.message });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    const { chatId } = data;

    client.to(`chat:${chatId}`).emit('typing:user', {
      chatId,
      userId,
      isTyping: true,
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('messages:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageId: string },
  ) {
    const userId = client.data.userId;
    const { chatId, messageId } = data;

    try {
      await this.chatService.markMessageAsRead(chatId, messageId, userId);

      client.to(`chat:${chatId}`).emit('messages:read', {
        chatId,
        userId,
        messageId,
      });
    } catch (error) {
      console.error('Mark as read error', error);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const { chatId } = data;

    client.join(`chat:${chatId}`);
    console.log(`User ${client.data.userId} joined chat ${chatId}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('chat:leave')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const { chatId } = data;

    client.leave(`chat:${chatId}`);
    console.log(`User ${client.data.userId} left chat ${chatId}`);
  }
}
