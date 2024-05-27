import { Module } from '@nestjs/common';
import { ServerChangeTrackerService } from './server-change-tracker.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ServerChangeTrackerService],
  exports: [ServerChangeTrackerService],
})
export class ServerChangeTrackerModule {}
