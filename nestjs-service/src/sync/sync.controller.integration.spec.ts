import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { ChangeDto } from '../models/external/change.dto';

describe('SyncController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // describe('/sync/client-changes (POST)', () => {
  //   it('should process client changes', async () => {
  //     const changeDtos: ChangeDto[] = [
  //       {
  //         type: 'insert',
  //         position: 5,
  //         text: ' World',
  //         vectorClock: { client1: 1 },
  //         clientId: '60d5f9f8f8a6f12a9c3e3a11',
  //       },
  //     ];
  //     return request(app.getHttpServer())
  //       .post('/sync/client-changes')
  //       .send(changeDtos)
  //       .expect(201)
  //       .expect({ message: 'Client changes processed successfully' });
  //   });

  //   it('should return 400 for invalid input', async () => {
  //     return request(app.getHttpServer())
  //       .post('/sync/client-changes')
  //       .send({ invalid: 'data' })
  //       .expect(400);
  //   });
  // });

  // describe('/sync/server-changes (GET)', () => {
  //   it('should retrieve server changes', async () => {
  //     return request(app.getHttpServer())
  //       .get('/sync/server-changes')
  //       .query({ since: '2023-01-01T00:00:00Z' })
  //       .expect(200)
  //       .expect((res) => {
  //         expect(Array.isArray(res.body)).toBe(true);
  //       });
  //   });

  //   it('should return 400 for invalid date format', async () => {
  //     return request(app.getHttpServer())
  //       .get('/sync/server-changes')
  //       .query({ since: 'invalid-date' })
  //       .expect(400);
  //   });
  // });

  // describe('/sync/reset-document (POST)', () => {
  //   it('should reset the document', async () => {
  //     return request(app.getHttpServer())
  //       .post('/sync/reset-document')
  //       .send({ initialDocument: 'Hello' })
  //       .expect(201)
  //       .expect({ message: 'Document reset successfully' });
  //   });

  //   it('should return 400 for invalid input', async () => {
  //     return request(app.getHttpServer())
  //       .post('/sync/reset-document')
  //       .send({ invalid: 'data' })
  //       .expect(400);
  //   });
  // });

  // describe('/sync/apply-operation (POST)', () => {
  //   it('should apply operation', async () => {
  //     const operation: ChangeDto = {
  //       type: 'insert',
  //       position: 5,
  //       text: ' World',
  //       vectorClock: { client1: 1 },
  //       clientId: '60d5f9f8f8a6f12a9c3e3a11',
  //     };
  //     return request(app.getHttpServer())
  //       .post('/sync/apply-operation')
  //       .send({ operation })
  //       .expect(201)
  //       .expect({ message: 'Operation applied successfully' });
  //   });

  //   it('should return 400 for invalid input', async () => {
  //     return request(app.getHttpServer())
  //       .post('/sync/apply-operation')
  //       .send({ invalid: 'data' })
  //       .expect(400);
  //   });
  // });

  // describe('/sync/document (GET)', () => {
  //   it('should retrieve the current document', async () => {
  //     return request(app.getHttpServer())
  //       .get('/sync/document')
  //       .expect(200)
  //       .expect((res) => {
  //         expect(typeof res.body.document).toBe('string');
  //       });
  //   });
  // });
});
