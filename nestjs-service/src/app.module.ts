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
import { WebsocketGateway } from './websocket/websocket.gateway';

@Module({
  imports: [ChangeProcessorModule, DatabaseModule, ServerChangeTrackerModule, SyncModule, HttpModule],
  controllers: [AppController],
  providers: [AppService, GoClientService,WebsocketGateway],
})
export class AppModule {}

// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ChangeProcessorModule } from './modules/change-processor.module';
// import { DatabaseModule } from './modules/database.module';
// import { ServerChangeTrackerModule } from './modules/server-change-tracker.module';
// import { SyncModule } from './modules/sync.module';
// import { HttpModule } from '@nestjs/axios';

// @Module({
//     imports: [ChangeProcessorModule, DatabaseModule, ServerChangeTrackerModule, SyncModule, HttpModule],
//     controllers: [AppController],
//     providers: [AppService],
// })
// export class AppModule {}
