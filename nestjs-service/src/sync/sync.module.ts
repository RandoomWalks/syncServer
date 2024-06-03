import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { ChangeProcessorModule } from '../change-processor/change-processor.module';
import { ServerChangeTrackerModule } from '../server-change-tracker/server-change-tracker.module';
import { GoClientService } from './go-client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule,ChangeProcessorModule, ServerChangeTrackerModule],
  controllers: [SyncController],
  providers: [GoClientService],
})
export class SyncModule {}
    


