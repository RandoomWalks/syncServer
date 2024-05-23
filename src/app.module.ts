import { Module } from '@nestjs/common';
import { SyncModule } from './presentation/sync/sync.module';
import { DatabaseModule } from './infrastructure/database/database.module';

/**
 * AppModule is the root module of the application.
 * It imports the SyncModule and DatabaseModule to integrate them into the application.
 */
@Module({
    imports: [SyncModule, DatabaseModule],
})
export class AppModule { }
