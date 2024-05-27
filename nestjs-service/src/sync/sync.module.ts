import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { ChangeProcessorModule } from '../change-processor/change-processor.module';
import { ServerChangeTrackerModule } from '../server-change-tracker/server-change-tracker.module';

@Module({
  imports: [ChangeProcessorModule, ServerChangeTrackerModule],
  controllers: [SyncController],
})
export class SyncModule {}
    