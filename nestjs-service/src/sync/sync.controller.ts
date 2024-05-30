// import { Controller, Post, Body, Get, Query } from '@nestjs/common';
// import { ChangeProcessorService } from '../change-processor/change-processor.service';
// import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';

// @Controller('sync')
// export class SyncController {
//     constructor(
//         private readonly changeProcessorService: ChangeProcessorService,
//         private readonly serverChangeTrackerService: ServerChangeTrackerService,
//     ) { }

//     @Post('client-changes')
//     async receiveClientChanges(@Body() changes: any[]): Promise<any> {
//         await this.changeProcessorService.processClientChanges(changes);
//         return { message: 'Client changes processed successfully' };
//     }

//     @Get('server-changes')
//     async sendServerChanges(@Query('since') since: string): Promise<any[]> {
//         const changesSince = new Date(since);
//         return await this.changeProcessorService.getServerChanges(changesSince);
//     }
// }

import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';

@Controller('sync')
export class SyncController {
    private readonly logger = new Logger(SyncController.name);

    constructor(
        private readonly changeProcessorService: ChangeProcessorService,
        private readonly serverChangeTrackerService: ServerChangeTrackerService,
    ) {}

    @Post('client-changes')
    async receiveClientChanges(@Body() changes: any[]): Promise<any> {
        this.logger.log('Received client changes');
        this.logger.debug(`Client changes data: ${JSON.stringify(changes)}`);

        try {
            await this.changeProcessorService.processClientChanges(changes);
            this.logger.log('Client changes processed successfully');
            return { message: 'Client changes processed successfully' };
        } catch (error) {
            this.logger.error('Error processing client changes', error.stack);
            throw error;
        }
    }

    @Get('server-changes')
    async sendServerChanges(@Query('since') since: string): Promise<any[]> {
        this.logger.log('Received request for server changes');
        this.logger.debug(`Query parameter 'since': ${since}`);

        try {
            const changesSince = new Date(since);
            this.logger.debug(`Parsed date: ${changesSince.toISOString()}`);

            const changes = await this.changeProcessorService.getServerChanges(changesSince);
            this.logger.log('Server changes retrieved successfully');
            return changes;
        } catch (error) {
            this.logger.error('Error retrieving server changes', error.stack);
            throw error;
        }
    }
}
