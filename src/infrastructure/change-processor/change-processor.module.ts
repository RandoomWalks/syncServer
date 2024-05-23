import { Module } from '@nestjs/common';
import { ChangeProcessorService } from './change-processor.service';
import { DatabaseModule } from '../database/database.module';

/**
 * ChangeProcessorModule handles the processing of changes received from the client.
 * It imports DatabaseModule to access the DatabaseService for database operations.
 */
@Module({
    imports: [DatabaseModule],
    providers: [ChangeProcessorService],
    exports: [ChangeProcessorService],
})
export class ChangeProcessorModule { }
