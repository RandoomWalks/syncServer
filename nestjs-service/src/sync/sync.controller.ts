import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';
import { GoClientService } from './go-client.service';
import { ChangeDto } from '../models/external/change.dto';

@WebSocketGateway()
@Controller('sync')
export class SyncController {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(SyncController.name);

    constructor(
        private readonly changeProcessorService: ChangeProcessorService,
        private readonly serverChangeTrackerService: ServerChangeTrackerService,
        private readonly goClientService: GoClientService,
    ) { }

    /**
     * Endpoint to receive client changes
     * Example Request Data:
     * [
     *   {
     *     "type": "insert",
     *     "position": 5,
     *     "text": " World",
     *     "vectorClock": {"client1": 1},
     *     "clientId": "60d5f9f8f8a6f12a9c3e3a11"  // Valid ObjectId
     *   }
     * ]
     */
    @Post('client-changes')
    async receiveClientChanges(@Body() changeDtos: ChangeDto[]): Promise<any> {
        this.logger.log('Received client changes');
        this.logger.debug(`Client changes data: ${JSON.stringify(changeDtos)}`);

        // Add logging to check the structure
        console.log('Received changeDtos:', changeDtos);

        try {
            await this.changeProcessorService.processClientChanges(changeDtos);
            this.logger.log('Client changes processed successfully');
            return { success: true, message: 'Client changes processed successfully' };
        } catch (error) {
            this.logger.error('Error processing client changes', error.stack);
            // throw error;
            return { success: false, message: 'Error processing client changes', error: error.message };

        }
    }

    /**
     * Endpoint to retrieve server changes since a given date
     * Example Request: GET /sync/server-changes?since=2023-01-01T00:00:00Z
     */
    @Get('server-changes')
    async sendServerChanges(@Query('since') since: string): Promise<ChangeDto[]> {
        this.logger.log('Received request for server changes');
        this.logger.debug(`Query parameter 'since': ${since}`);
        const changesSince = new Date(since);
        if (isNaN(changesSince.getTime())) {
            this.logger.error('Invalid date format');
            throw new Error('Invalid time value');
        }
        try {
            this.logger.debug(`Parsed date: ${changesSince.toISOString()}`);
            const changes = await this.changeProcessorService.getServerChanges(changesSince);
            this.logger.log('Server changes retrieved successfully');
            return changes;
        } catch (error) {
            this.logger.error('Error retrieving server changes', error.stack);
            throw error;
        }
    }

    /**
     * Endpoint to process data via GoClientService
     * Example Request Data:
     * {
     *   "data": [
     *     {
     *       "type": "insert",
     *       "position": 5,
     *       "text": " World",
     *       "vectorClock": {"client1": 1},
     *       "clientId": "60d5f9f8f8a6f12a9c3e3a11"  // Valid ObjectId
     *     }
     *   ]
     * }
     */
    @Post('process')
    async processData(@Body() body: { data: ChangeDto[] }) {
        return this.goClientService.syncData(body.data);
    }

    /**
     * Endpoint to reset the document to an initial state
     * Example Request Data:
     * {
     *   "initialDocument": "Hello"
     * }
     */
    @Post('reset-document')
    async resetDocument(@Body() body: { initialDocument: string }): Promise<any> {
        this.logger.log('Received request to reset document');
        this.logger.debug(`Initial document: ${body.initialDocument}`);

        try {
            await this.changeProcessorService.resetDocument(body.initialDocument);
            this.logger.log('Document reset successfully');
            return { success: true, message: 'Document reset successfully' };
        } catch (error) {
            this.logger.error('Error resetting document', error.stack);
            return { success: false, message: 'Error processing Document reset', error: error.message };

            // throw error;
        }
    }

    /**
     * Endpoint to apply an operation to the document
     * Example Request Data:
     * {
     *   "operation": {
     *     "type": "insert",
     *     "position": 5,
     *     "text": " World",
     *     "vectorClock": {"client1": 1},
     *     "clientId": "60d5f9f8f8a6f12a9c3e3a11"  // Valid ObjectId
     *   }
     * }
     */
    @Post('apply-operation')
    async applyOperation(@Body() body: { operation: ChangeDto }): Promise<any> {
        this.logger.log('Received request to apply operation');
        this.logger.debug(`Operation data: ${JSON.stringify(body.operation)}`);

        try {
            await this.changeProcessorService.applyOperation(body.operation);
            this.logger.log('Operation applied successfully');
            return { success: true, message: 'Operation applied successfully' };
        } catch (error) {
            this.logger.error('Error applying operation', error.stack);
            return { success: false, message: 'Operation apply Error' ,error: error.message};

            // throw error;
        }
    }

    /**
     * Endpoint to get the current state of the document
     * Example Request: GET /sync/document
     */
    @Get('document')
    async getDocument(): Promise<any> {
        this.logger.log('Received request to get current document');

        try {
            const document = await this.changeProcessorService.getDocument();
            this.logger.log('Current document retrieved successfully');
            return {success: true, document };
        } catch (error) {
            this.logger.error('Error retrieving document', error.stack);
            return {success: true, message: 'Error retrieving document' ,error: error.message };

            // throw error;
        }
    }
}
