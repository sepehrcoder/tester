import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

interface AuthedSocket extends Socket {
  data: { userId: string };
}

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(socket: AuthedSocket) {
    try {
      const token = this.extractToken(socket);
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      socket.data.userId = payload.sub;
    } catch {
      socket.emit('chat:error', { message: 'Authentication failed' });
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('chat:join')
  async onJoin(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      // getMessages doubles as the participant check, and hands the client
      // the history it needs right when it joins the room.
      const messages = await this.chat.getMessages(
        data.conversationId,
        socket.data.userId,
      );
      await socket.join(this.room(data.conversationId));
      socket.emit('chat:history', {
        conversationId: data.conversationId,
        messages,
      });
    } catch {
      socket.emit('chat:error', { message: 'Cannot join this conversation' });
    }
  }

  @SubscribeMessage('chat:send')
  async onSend(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { conversationId: string; body: string },
  ) {
    try {
      const message = await this.chat.sendMessage(
        data.conversationId,
        socket.data.userId,
        data.body,
      );
      this.server
        .to(this.room(data.conversationId))
        .emit('chat:message', message);
    } catch {
      socket.emit('chat:error', { message: 'Message could not be sent' });
    }
  }

  private room(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private extractToken(socket: Socket): string {
    const fromAuth = socket.handshake.auth?.token as string | undefined;
    const fromHeader = socket.handshake.headers.authorization;
    const raw = fromAuth ?? fromHeader;
    if (!raw) throw new UnauthorizedException();
    return raw.replace(/^Bearer\s+/i, '');
  }
}
