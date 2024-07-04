import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})

@WebSocketGateway()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebsocketGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('clientChanges')
  handleClientChanges(client: Socket, payload: any): void {
    this.logger.log(`Received changes from client ${client.id}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
    // Process client changes and broadcast to other clients
    this.server.emit('serverChanges', payload);
    this.logger.log(`Broadcasted changes to all clients`);
  }
}