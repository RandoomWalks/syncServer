// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChangeProcessorModule } from './change-processor/change-processor.module';
import { DatabaseModule } from './database/database.module';
import { ServerChangeTrackerModule } from './server-change-tracker/server-change-tracker.module';
import { SyncModule } from './sync/sync.module';
import { HttpModule } from '@nestjs/axios';
import { GoClientService } from './sync/go-client.service';

@Module({
  imports: [ChangeProcessorModule, DatabaseModule, ServerChangeTrackerModule, SyncModule, HttpModule],
  controllers: [AppController],
  providers: [AppService, GoClientService],
})
export class AppModule {}
