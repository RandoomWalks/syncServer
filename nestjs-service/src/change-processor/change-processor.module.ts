import { Module } from '@nestjs/common';
import { ChangeProcessorService } from './change-processor.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [ChangeProcessorService],
    exports: [ChangeProcessorService],
})
export class ChangeProcessorModule { }
