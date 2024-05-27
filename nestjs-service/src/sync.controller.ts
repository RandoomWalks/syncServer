import { Controller, Post, Body } from '@nestjs/common';
import { GoClientService } from './go-client.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly goClientService: GoClientService) {}

  @Post('process')
  async processData(@Body() body: { data: string[] }) {
    return this.goClientService.syncData(body.data);
  }
}
