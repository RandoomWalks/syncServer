import { Test, TestingModule } from '@nestjs/testing';
import { ChangeProcessorService } from './change-processor.service';
import { DatabaseService } from '../database/database.service';
import { ChangeConverter } from '../converters/change.converter';
import { ChangeDto } from '../models/external/change.dto';
import { OTDocument, Operation } from '../crdt/ot-document.model';
import { Db, ObjectId } from 'mongodb';

jest.mock('../database/database.service');
jest.mock('../converters/change.converter');

describe('ChangeProcessorService', () => {
  let service: ChangeProcessorService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeProcessorService,
        DatabaseService,
      ],
    }).compile();

    service = module.get<ChangeProcessorService>(ChangeProcessorService);
    databaseService = module.get<DatabaseService>(DatabaseService);

    // Use a method to initialize the private otDocument member
    await service.resetDocument(''); // Initialize with empty document for testing
  });

  describe('resetDocument', () => {
    it('should reset the document', async () => {
      await service.resetDocument('Hello');
      const document = await service.getDocument();
      expect(document).toBe('Hello');
    });
  });

  describe('applyOperation', () => {
    it('should apply the operation', async () => {
      const operation: ChangeDto = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };
      const internalOperation: Operation = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };

      ChangeConverter.toInternal = jest.fn().mockReturnValue(internalOperation);

      await service.applyOperation(operation);

      const document = await service.getDocument();
      expect(document).toBe('Hello World');
    });
  });

  describe('getDocument', () => {
    it('should return the current document', async () => {
      await service.resetDocument('Hello World');
      const document = await service.getDocument();
      expect(document).toBe('Hello World');
    });
  });

  describe('processClientChanges', () => {
    it('should process client changes and update the database', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      const internalOperations: Operation[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];

      ChangeConverter.toInternal = jest.fn().mockImplementation(dto => internalOperations[0]);

      const db = { collection: jest.fn().mockReturnValue({ bulkWrite: jest.fn().mockResolvedValue({}) }) } as unknown as Db;
      databaseService.getDb = jest.fn().mockResolvedValue(db);

      await service.processClientChanges(changeDtos);

      expect(databaseService.getDb).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith('client-changes');
      expect(db.collection('client-changes').bulkWrite).toHaveBeenCalled();
    });

    it('should handle invalid ObjectId format for clientId', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: 'invalid-object-id' }];
      const internalOperations: Operation[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];

      ChangeConverter.toInternal = jest.fn().mockImplementation(dto => internalOperations[0]);

      const db = { collection: jest.fn().mockReturnValue({ bulkWrite: jest.fn().mockResolvedValue({}) }) } as unknown as Db;
      databaseService.getDb = jest.fn().mockResolvedValue(db);

      await service.processClientChanges(changeDtos);

      expect(db.collection('client-changes').bulkWrite).toHaveBeenCalled();
    });
  });

  describe('getServerChanges', () => {
    it('should retrieve server changes from the database', async () => {
      const since = new Date('2023-01-01T00:00:00Z');
      const changeDocuments = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: new ObjectId('60d5f9f8f8a6f12a9c3e3a11'), updatedAt: new Date() }];
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];

      const db = { collection: jest.fn().mockReturnValue({ find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(changeDocuments) }) }) } as unknown as Db;
      databaseService.getDb = jest.fn().mockResolvedValue(db);
      ChangeConverter.toExternal = jest.fn().mockImplementation(doc => changeDtos[0]);

      const result = await service.getServerChanges(since);

      expect(databaseService.getDb).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith('client-changes');
      expect(db.collection('client-changes').find).toHaveBeenCalledWith({ updatedAt: { $gt: since } });
      expect(result).toEqual(changeDtos);
    });
  });
});
