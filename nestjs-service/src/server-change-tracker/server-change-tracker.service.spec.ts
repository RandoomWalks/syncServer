import { Test, TestingModule } from '@nestjs/testing';
import { ServerChangeTrackerService } from './server-change-tracker.service';
import { DatabaseService } from '../database/database.service';
import { Db } from 'mongodb';

describe('ServerChangeTrackerService', () => {
  let service: ServerChangeTrackerService;
  let dbService: DatabaseService;
  let db: Db;
  let collectionMock: any;

  beforeEach(async () => {
    collectionMock = {
      insertOne: jest.fn(),
      find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
    };

    db = {
      collection: jest.fn().mockReturnValue(collectionMock),
    } as any;

    dbService = {
      getDb: jest.fn().mockResolvedValue(db),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerChangeTrackerService,
        { provide: DatabaseService, useValue: dbService },
      ],
    }).compile();

    service = module.get<ServerChangeTrackerService>(ServerChangeTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should track changes', async () => {
    const change = { _id: 1, type: 'create', data: { name: 'test' } };
    await service.trackChange(change);

    expect(collectionMock.insertOne).toHaveBeenCalledWith(change);
  });

  it('should retrieve changes since a timestamp', async () => {
    const timestamp = new Date();
    await service.getChangesSince(timestamp);

    expect(collectionMock.find).toHaveBeenCalledWith({ timestamp: { $gt: timestamp } });
    expect(collectionMock.find().toArray).toHaveBeenCalled();
  });
});
