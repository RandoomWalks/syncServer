import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { ChangeProcessorModule } from '../../infrastructure/change-processor/change-processor.module';
import { ServerChangeTrackerModule } from '../../infrastructure/server-change-tracker/server-change-tracker.module';

/**
 * SyncModule defines the synchronization logic and integrates necessary modules.
 * It imports ChangeProcessorModule and ServerChangeTrackerModule for synchronization operations.
 */
@Module({
    imports: [ChangeProcessorModule, ServerChangeTrackerModule],
    controllers: [SyncController],
})
export class SyncModule { }