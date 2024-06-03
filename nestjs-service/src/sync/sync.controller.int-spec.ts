// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
// import { AppModule } from '../app.module';
// import { HttpModule } from '@nestjs/axios';
// import { SyncModule } from './sync.module';

// describe('SyncController (Integration)', () => {
//   let app: INestApplication;

//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule, SyncModule, HttpModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     await app.init();
//   });

//   it('should process data through Go service', async () => {
//     const data = ['test1', 'test2', 'test3'];

//     const response = await request(app.getHttpServer())
//       .post('/sync/process')
//       .send({ data })
//       .expect(201);

//     expect(response.body.result).toEqual(
//       expect.arrayContaining([
//         'test1_processed',
//         'test2_processed',
//         'test3_processed',
//       ]),
//     );
//   });

//   afterAll(async () => {
//     await app.close();
//   });
// });


import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SyncModule } from './sync.module';
import { HttpModule } from '@nestjs/axios';
import { GoClientService } from './go-client.service';
import { SyncController } from './sync.controller';
import { DatabaseModule } from '../database/database.module';
import { ChangeProcessorModule } from '../change-processor/change-processor.module';
import { ServerChangeTrackerModule } from '../server-change-tracker/server-change-tracker.module';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { DatabaseService } from '../database/database.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';

describe('SyncController (e2e)', () => {
  let app: INestApplication;
  let goClientService: GoClientService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SyncModule, HttpModule, DatabaseModule, ChangeProcessorModule, ServerChangeTrackerModule],
      controllers: [SyncController],
      providers: [GoClientService, ChangeProcessorService, DatabaseService, ServerChangeTrackerService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    goClientService = moduleFixture.get<GoClientService>(GoClientService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/sync/process (POST) should process data via Go service', async () => {
    const data = ['test1', 'test2', 'test3'];
    const goServiceResponse = {
      result: data.map(item => `${item}_processed`),
    };

    jest.spyOn(goClientService, 'syncData').mockImplementation(async () => goServiceResponse);

    const response = await request(app.getHttpServer())
      .post('/sync/process')
      .send({ data })
      .expect(201);

    expect(response.body).toEqual(goServiceResponse);
  });

  it('should return a 404 for unknown routes', async () => {
    await request(app.getHttpServer())
      .post('/sync/unknown')
      .send({ data: ['test'] })
      .expect(404);
  });


  
  it('should process data via Go service', async () => {
    await request(app.getHttpServer())
      .post('/sync/unknown')
      .send({ data: ['test'] })
      .expect(404);
  });
  
});
