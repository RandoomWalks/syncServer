import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ChangeProcessorService } from '../../infrastructure/change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../../infrastructure/server-change-tracker/server-change-tracker.service';

/**
 * SyncController defines endpoints for synchronizing data between the client and server.
 * It uses ChangeProcessorService to process client changes and retrieve server changes.
 * It uses ServerChangeTrackerService to track changes on the server.
 */
@Controller('sync')
export class SyncController {
    constructor(
        private readonly changeProcessorService: ChangeProcessorService,
        private readonly serverChangeTrackerService: ServerChangeTrackerService,
    ) { }

    /**
     * Endpoint to receive changes from the client.
     * @param changes - List of changes from the client
     */
    //  extracts the request body from the incoming HTTP request. 
    @Post('client-changes')
    async receiveClientChanges(@Body() changes: any[]): Promise<void> {
        await this.changeProcessorService.processClientChanges(changes);
    }

    /**
     * Endpoint to send server changes to the client.
     * @param since - The timestamp from which to retrieve changes
     * @returns List of changes
     */
    //  handle GET requests to the /server-changes endpoint. 
    // . It takes a query parameter named since, which represents a timestamp indicating the time of the last change the client has received from the server.
    @Get('server-changes')
    async sendServerChanges(@Query('since') since: string): Promise<any[]> {
        const changesSince = new Date(since);
        return await this.changeProcessorService.getServerChanges(changesSince);
    }
}
