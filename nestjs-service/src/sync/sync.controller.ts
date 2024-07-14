import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';
import { GoClientService } from './go-client.service';
import { ChangeDto } from '../models/external/change.dto';
import { OTDocument, Operation, VectorClock } from '../crdt/ot-document.model';

@Controller('sync')
export class SyncController {
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
        console.log('Received client changes');
        console.debug(`Client changes data: ${JSON.stringify(changeDtos)}`);
    
        if (!changeDtos || changeDtos.length === 0) {
            console.warn('No changes received');
            return { success: false, message: 'No changes received' };
        }
    
        try {
            const result = await this.changeProcessorService.processClientChanges(changeDtos);
            console.log('Client changes processed successfully');
            return { success: true, message: 'Client changes processed successfully' };
        } catch (error) {
            console.error('Error processing client changes', error);
            return { success: false, message: 'Error processing client changes', error: error.message };
        }
    }

    /**
     * Endpoint to retrieve server changes since a given date
     * Example Request: GET /sync/server-changes?since=2023-01-01T00:00:00Z
     */
    @Get('server-changes')
    async sendServerChanges(
        @Query('since') since?: string,
        @Query('vectorClock') vectorClockString?: string
    ): Promise<any> {
        console.log('Received request for server changes');
        console.debug(`Query parameter 'since': ${since}`);
        console.debug(`Query parameter 'vectorClock': ${vectorClockString}`);
    
        let sinceDate: Date = new Date(0); // Default to epoch if not provided
        let vectorClock: VectorClock | undefined;
    
        if (since && !isNaN(Date.parse(since))) {
            sinceDate = new Date(since);
        }
    
        if (vectorClockString) {
            try {
                vectorClock = JSON.parse(vectorClockString);
            } catch (error) {
                console.error('Error parsing vectorClock', error);
                // You might want to handle this error, perhaps by setting vectorClock to undefined
            }
        }
    
        try {
            console.debug('Calling changeProcessorService.getServerChanges');
            const { changes, serverVC } = await this.changeProcessorService.getServerChanges(sinceDate, vectorClock);
    
            console.log('Server changes retrieved successfully');
            return { changes, serverVC };
        } catch (error) {
            console.error('Error retrieving server changes', error);
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
        console.log('Received request to reset document');
        console.debug(`Initial document: ${body.initialDocument}`);

        try {
            await this.changeProcessorService.resetDocument(body.initialDocument);
            console.log('Document reset successfully');
            return { success: true, message: 'Document reset successfully' };
        } catch (error) {
            console.error('Error resetting document', error.stack);
            return { success: false, message: 'Error processing Document reset', error: error.message };
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
        console.log('Received request to apply operation');
        console.debug(`Operation data: ${JSON.stringify(body.operation)}`);

        try {
            await this.changeProcessorService.applyOperation(body.operation);
            console.log('Operation applied successfully');
            return { success: true, message: 'Operation applied successfully' };
        } catch (error) {
            console.error('Error applying operation', error.stack);
            return { success: false, message: 'Operation apply Error', error: error.message };
        }
    }

    /**
     * Endpoint to get the current state of the document
     * Example Request: GET /sync/document
     */
    @Get('document')
    async getDocument(): Promise<any> {
        console.log('Received request to get current document');

        try {
            const document = await this.changeProcessorService.getDocument();
            console.log('Current document retrieved successfully');
            return { success: true, document };
        } catch (error) {
            console.error('Error retrieving document', error.stack);
            return { success: false, message: 'Error retrieving document', error: error.message };
        }
    }
}
