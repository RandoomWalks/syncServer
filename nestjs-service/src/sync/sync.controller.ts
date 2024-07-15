import { Controller, Post, Body, Get, Query, Logger, ValidationPipe, BadRequestException,InternalServerErrorException } from '@nestjs/common';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';
import { GoClientService } from './go-client.service';
import { ChangeDto, ServerChangesQueryDto } from '../models/external/change.dto';
import { OTDocument, Operation, VectorClock } from '../crdt/ot-document.model';
import { Delete } from '@nestjs/common';

@Controller('sync')
export class SyncController {
    private readonly logger = new Logger(SyncController.name);

    constructor(
        private readonly changeProcessorService: ChangeProcessorService,
        private readonly serverChangeTrackerService: ServerChangeTrackerService,
        private readonly goClientService: GoClientService,
    ) { }


    @Delete('clear-db')
    async clearDatabase(): Promise<any> {
        this.logger.log('Clearing database');
        try {
            await this.changeProcessorService.clearDatabase();
            return { success: true, message: 'Database cleared successfully' };
        } catch (error) {
            this.logger.error('Error clearing database', error);
            return { success: false, message: 'Error clearing database', error: error.message };
        }
    }
    
    @Post('reset-document')
    async resetDocument(@Body('initialContent') initialContent: string = ''): Promise<any> {
        this.logger.log('Resetting document');
        try {
            await this.changeProcessorService.resetDocument(initialContent);
            return { success: true, message: 'Document reset successfully' };
        } catch (error) {
            this.logger.error('Error resetting document', error);
            return { success: false, message: 'Error resetting document', error: error.message };
        }
    }

    @Post('client-connect')
    async clientConnect(@Body('clientId') clientId: string, @Body('vectorClock') clientVC: { [clientId: string]: number }): Promise<any> {
        this.logger.log('Client connected:', clientId);
        // this.logger.log('Client connected:', clientId);
        this.logger.log('Client vector clock:', JSON.stringify(clientVC, null, 2));

        const OTdoc= await this.changeProcessorService.getOTDocument();
        // Get the current server VC
        let serverVC = await OTdoc.getServerVC(true);
        
        // Update server VC if clientID not in the serverVC
        if (!serverVC[clientId]) {
            serverVC[clientId] = 0;
            await OTdoc.setServerVectorClock(serverVC);
            this.logger.log('Added new client to server vector clock:', clientId);
        }

        let needSync = false;
        for (const id in serverVC) {
            if ((clientVC[id] || 0) < serverVC[id]) {
                needSync = true;
                break;
            }
        }
        for (const id in clientVC) {
            if ((serverVC[id] || 0) < clientVC[id]) {
                serverVC[id] = clientVC[id];
                needSync = true;
            }
        }

        if (needSync) {
            await OTdoc.setServerVectorClock(serverVC);
            this.logger.log('Updated server vector clock:', JSON.stringify(serverVC, null, 2));
            return { serverVC, needSync: true };
        }

        // Compare clientVC with serverVC
        if (serverVC[clientId] && serverVC[clientId] > clientVC[clientId]) {
            // If server's entry is more recent, send back the serverVC to the client
            return { serverVC };
        }

        // If client's entry is more recent, update the serverVC
        if (clientVC[clientId] > serverVC[clientId]) {
            serverVC[clientId] = clientVC[clientId];
            await OTdoc.setServerVectorClock(serverVC);
            this.logger.log('Updated server vector clock with client data:', clientId);
        }

        return { serverVC, needSync: false };

    }
    
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
    async receiveClientChanges(@Body(new ValidationPipe({ transform: true, forbidUnknownValues: true })) changeDtos: ChangeDto[]): Promise<any> {
        this.logger.log('Received client changes');
        this.logger.debug(`Client changes data: ${JSON.stringify(changeDtos, null, 2)}`);
    
        if (!changeDtos || changeDtos.length === 0) {
            this.logger.warn('No changes received');
            throw new BadRequestException('No changes received');
        }
    
        try {
            const result = await this.changeProcessorService.processClientChanges(changeDtos);
            if (result.accepted) {
                this.logger.log('Client changes processed successfully, result:', result);
                return { success: true, message: 'Client changes processed successfully' };
            } else {
                this.logger.warn('Client out of sync, returning missing changes');
                return { success: false, message: 'Client out of sync', changes: result.changes };
            }
        } catch (error) {
            this.logger.error('Error processing client changes', error);
            throw new InternalServerErrorException('Error processing client changes', error.message);
        }
    }

    /**
     * Endpoint to retrieve server changes since a given date
     * Example Request: GET /sync/server-changes?since=2023-01-01T00:00:00Z
     */
    @Get('server-changes')
    async sendServerChanges(@Query(new ValidationPipe({ transform: true, forbidUnknownValues: true })) query: ServerChangesQueryDto): Promise<any> {
        this.logger.log('Received request for server changes');
        this.logger.debug(`Query: ${JSON.stringify(query, null, 2)}`);
    
        let sinceDate: Date = new Date(0);
        let vectorClock: Record<string, number> | undefined;
    
        if (query.since) {
            sinceDate = new Date(query.since);
            if (isNaN(sinceDate.getTime())) {
                throw new BadRequestException('Invalid date format for "since" parameter');
            }
        }
    
        if (query.vectorClock) {
            try {
                vectorClock = JSON.parse(query.vectorClock);
                this.logger.debug(`Parsed vectorClock: ${JSON.stringify(vectorClock, null, 2)}`);
    
                if (!vectorClock || Object.keys(vectorClock).length === 0) {
                    throw new BadRequestException('Invalid or empty vector clock');
                }
            } catch (error) {
                this.logger.error('Error parsing vectorClock', error);
                throw new BadRequestException('Invalid vectorClock format');
            }
        }
    
        try {
            const { changes, serverVC } = await this.changeProcessorService.getServerChanges(sinceDate, vectorClock);
            this.logger.log('Server changes retrieved successfully');
            this.logger.debug(`Retrieved changes: ${JSON.stringify(changes, null, 2)}`);
            this.logger.debug(`Current server VC: ${JSON.stringify(serverVC, null, 2)}`);
            return { success: true, changes, serverVC };
        } catch (error) {
            this.logger.error('Error retrieving server changes', error);
            throw new InternalServerErrorException('Error retrieving server changes', error.message);
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
    // @Post('reset-document')
    // async resetDocument(@Body() body: { initialDocument: string }): Promise<any> {
    //     this.logger.log('Received request to reset document');
    //     this.logger.debug(`Initial document: ${body.initialDocument}`);

    //     try {
    //         await this.changeProcessorService.resetDocument(body.initialDocument);
    //         this.logger.log('Document reset successfully');
    //         return { success: true, message: 'Document reset successfully' };
    //     } catch (error) {
    //         this.logger.error('Error resetting document', error.stack);
    //         return { success: false, message: 'Error processing Document reset', error: error.message };
    //     }
    // }

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
            return { success: false, message: 'Operation apply Error', error: error.message };
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
            return { success: true, document };
        } catch (error) {
            this.logger.error('Error retrieving document', error.stack);
            return { success: false, message: 'Error retrieving document', error: error.message };
        }
    }


}
