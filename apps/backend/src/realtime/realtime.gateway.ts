import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface JoinEventPayload {
  eventId: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      sub: string;
      email: string;
      orgId: string;
      role: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8081').split(','),
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // SECURITY: Require JWT authentication for WebSocket connections
      const token = client.handshake.auth?.token ||
                    client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log(`Client ${client.id} rejected: No token provided`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const secret = this.configService.get('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Store user info on socket for later use
      client.data.user = payload;

      console.log(`Client ${client.id} connected (user: ${payload.sub})`);
    } catch (error) {
      console.log(`Client ${client.id} rejected: Invalid token`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.user?.sub || 'unknown';
    console.log(`Client ${client.id} disconnected (user: ${userId})`);
  }

  @SubscribeMessage('join-event')
  handleJoinEvent(
    @MessageBody() payload: JoinEventPayload,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    // SECURITY: Verify user is authenticated
    if (!client.data?.user) {
      throw new WsException('Authentication required');
    }

    const { eventId } = payload;
    const userId = client.data.user.sub;

    // Join the event room
    client.join(`event:${eventId}`);
    console.log(`User ${userId} joined event: ${eventId}`);
    return { status: 'joined', eventId };
  }

  @SubscribeMessage('leave-event')
  handleLeaveEvent(
    @MessageBody() payload: JoinEventPayload,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    // SECURITY: Verify user is authenticated
    if (!client.data?.user) {
      throw new WsException('Authentication required');
    }

    const { eventId } = payload;
    const userId = client.data.user.sub;

    client.leave(`event:${eventId}`);
    console.log(`User ${userId} left event: ${eventId}`);
    return { status: 'left', eventId };
  }

  /**
   * Broadcast pairings posted to all clients in event room
   */
  emitPairingsPosted(eventId: string, roundNumber: number) {
    this.server.to(`event:${eventId}`).emit('pairings-posted', {
      eventId,
      roundNumber,
      timestamp: new Date(),
    });
    console.log(`Emitted pairings-posted for event ${eventId}, round ${roundNumber}`);
  }

  /**
   * Broadcast standings updated to all clients in event room
   */
  emitStandingsUpdated(eventId: string) {
    this.server.to(`event:${eventId}`).emit('standings-updated', {
      eventId,
      timestamp: new Date(),
    });
    console.log(`Emitted standings-updated for event ${eventId}`);
  }

  /**
   * Broadcast round started to all clients in event room
   */
  emitRoundStarted(eventId: string, roundNumber: number) {
    this.server.to(`event:${eventId}`).emit('round-started', {
      eventId,
      roundNumber,
      timestamp: new Date(),
    });
    console.log(`Emitted round-started for event ${eventId}, round ${roundNumber}`);
  }

  /**
   * Broadcast round ended to all clients in event room
   */
  emitRoundEnded(eventId: string, roundNumber: number) {
    this.server.to(`event:${eventId}`).emit('round-ended', {
      eventId,
      roundNumber,
      timestamp: new Date(),
    });
    console.log(`Emitted round-ended for event ${eventId}, round ${roundNumber}`);
  }

  /**
   * Broadcast match result reported to all clients in event room
   */
  emitMatchResultReported(eventId: string, matchId: string, tableNumber: number) {
    this.server.to(`event:${eventId}`).emit('match-result-reported', {
      eventId,
      matchId,
      tableNumber,
      timestamp: new Date(),
    });
    console.log(`Emitted match-result-reported for event ${eventId}, table ${tableNumber}`);
  }

  /**
   * Broadcast timer update to all clients in event room
   */
  emitTimerUpdate(eventId: string, roundNumber: number, secondsRemaining: number) {
    this.server.to(`event:${eventId}`).emit('timer-update', {
      eventId,
      roundNumber,
      secondsRemaining,
    });
  }

  /**
   * Broadcast announcement to all clients in event room
   */
  emitAnnouncement(eventId: string, title: string, message: string) {
    this.server.to(`event:${eventId}`).emit('announcement', {
      eventId,
      title,
      message,
      timestamp: new Date(),
    });
    console.log(`Emitted announcement for event ${eventId}: ${title}`);
  }
}
