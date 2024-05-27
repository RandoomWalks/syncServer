import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly changeProcessorService: ChangeProcessorService,
    private readonly serverChangeTrackerService: ServerChangeTrackerService,
  ) {}

  @Post('client-changes')
  async receiveClientChanges(@Body() changes: any[]): Promise<any> {
    await this.changeProcessorService.processClientChanges(changes);
    return { message: 'Client changes processed successfully' };
  }

  @Get('server-changes')
  async sendServerChanges(@Query('since') since: string): Promise<any[]> {
    const changesSince = new Date(since);
    return await this.changeProcessorService.getServerChanges(changesSince);
  }
}
