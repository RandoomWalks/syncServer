import { Module } from '@nestjs/common';
import { ServerChangeTrackerService } from './server-change-tracker.service';
import { DatabaseModule } from '../database/database.module';

/**
 * ServerChangeTrackerModule tracks changes made on the server for synchronization purposes.
 * It imports DatabaseModule to access the DatabaseService for database operations.
 */
@Module({
    imports: [DatabaseModule],
    providers: [ServerChangeTrackerService],
    exports: [ServerChangeTrackerService],
})
export class ServerChangeTrackerModule { }
