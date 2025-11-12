import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface JoinEventPayload {
  eventId: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-event')
  handleJoinEvent(
    @MessageBody() payload: JoinEventPayload,
    @ConnectedSocket() client: Socket
  ) {
    const { eventId } = payload;
    client.join(`event:${eventId}`);
    console.log(`Client ${client.id} joined event: ${eventId}`);
    return { status: 'joined', eventId };
  }

  @SubscribeMessage('leave-event')
  handleLeaveEvent(
    @MessageBody() payload: JoinEventPayload,
    @ConnectedSocket() client: Socket
  ) {
    const { eventId } = payload;
    client.leave(`event:${eventId}`);
    console.log(`Client ${client.id} left event: ${eventId}`);
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
