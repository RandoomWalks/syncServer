import { ObjectId } from 'mongodb'; // Ensure you have this import
import { ChangeDto } from '../models/external/change.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeProcessorService } from './change-processor.service';
import { DatabaseService } from '../database/database.service';
import { Db } from 'mongodb';
import { ChangeConverter } from '../converters/change.converter'; // Ensure this import
import { Change } from '../models/internal/change.model'; // Ensure this import

describe('ChangeProcessorService', () => {
  let service: ChangeProcessorService;
  let dbService: DatabaseService;
  let db: Db;
  let collectionMock: any;

  beforeEach(async () => {
    collectionMock = {
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }), // Ensure toArray returns an array
    };

    db = {
      collection: jest.fn().mockReturnValue(collectionMock),
    } as any;

    dbService = {
      getDb: jest.fn().mockResolvedValue(db),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeProcessorService,
        { provide: DatabaseService, useValue: dbService },
      ],
    }).compile();

    service = module.get<ChangeProcessorService>(ChangeProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process client changes', async () => {
    const changes: ChangeDto[] = [
      { type: 'create', data: { _id: '1', name: 'test' } },
      { type: 'update', data: { _id: '1', name: 'updated' } },
      { type: 'delete', data: { _id: '1' } },
    ];

    await service.processClientChanges(changes);

    expect(collectionMock.insertOne).toHaveBeenCalledWith(changes[0].data);
    expect(collectionMock.updateOne).toHaveBeenCalledWith(
      { _id: changes[1].data._id },
      { $set: changes[1].data },
    );
    expect(collectionMock.deleteOne).toHaveBeenCalledWith({ _id: changes[2].data._id });
  });

  it('should retrieve server changes', async () => {
    const since = new Date();
    const mockChanges = [
      { _id: new ObjectId(), type: 'update', data: { value: 'test' }, updatedAt: new Date() }
    ];
    
    jest.spyOn(collectionMock, 'find').mockReturnValue({
      toArray: jest.fn().mockResolvedValue(mockChanges)
    });

    const changes = await service.getServerChanges(since);

    expect(collectionMock.find).toHaveBeenCalledWith({ updatedAt: { $gt: since } });
    expect(collectionMock.find().toArray).toHaveBeenCalled();
    expect(changes).toEqual(mockChanges.map(ChangeConverter.toExternal));
  });
});
