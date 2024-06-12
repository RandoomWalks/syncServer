import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';
import { GoClientService } from './go-client.service';
import { ChangeDto } from '../models/external/change.dto';

describe('SyncController', () => {
  let syncController: SyncController;
  let changeProcessorService: ChangeProcessorService;
  let serverChangeTrackerService: ServerChangeTrackerService;
  let goClientService: GoClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: ChangeProcessorService,
          useValue: {
            processClientChanges: jest.fn(),
            getServerChanges: jest.fn(),
            resetDocument: jest.fn(),
            applyOperation: jest.fn(),
            getDocument: jest.fn(),
          },
        },
        {
          provide: ServerChangeTrackerService,
          useValue: {},
        },
        {
          provide: GoClientService,
          useValue: {
            syncData: jest.fn(),
          },
        },
      ],
    }).compile();

    syncController = module.get<SyncController>(SyncController);
    changeProcessorService = module.get<ChangeProcessorService>(ChangeProcessorService);
    serverChangeTrackerService = module.get<ServerChangeTrackerService>(ServerChangeTrackerService);
    goClientService = module.get<GoClientService>(GoClientService);
  });

  describe('receiveClientChanges', () => {
    it('should process client changes successfully', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      await expect(syncController.receiveClientChanges(changeDtos)).resolves.toEqual({ message: 'Client changes processed successfully' });
      expect(changeProcessorService.processClientChanges).toHaveBeenCalledWith(changeDtos);
    });

    it('should throw an error if processing client changes fails', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      jest.spyOn(changeProcessorService, 'processClientChanges').mockRejectedValue(new Error('Error processing client changes'));
      await expect(syncController.receiveClientChanges(changeDtos)).rejects.toThrow('Error processing client changes');
    });
  });

  describe('sendServerChanges', () => {
    it('should retrieve server changes successfully', async () => {
      const changes: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      jest.spyOn(changeProcessorService, 'getServerChanges').mockResolvedValue(changes);
      await expect(syncController.sendServerChanges('2023-01-01T00:00:00Z')).resolves.toEqual(changes);
      expect(changeProcessorService.getServerChanges).toHaveBeenCalledWith(new Date('2023-01-01T00:00:00Z'));
    });

    it('should throw an error for invalid date format', async () => {
      await expect(syncController.sendServerChanges('invalid-date')).rejects.toThrow('Invalid time value');
    });
  });

  describe('processData', () => {
    it('should process data via GoClientService successfully', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      jest.spyOn(goClientService, 'syncData').mockResolvedValue({ message: 'Data processed successfully' });
      await expect(syncController.processData({ data: changeDtos })).resolves.toEqual({ message: 'Data processed successfully' });
      expect(goClientService.syncData).toHaveBeenCalledWith(changeDtos);
    });
  });

  describe('resetDocument', () => {
    it('should reset the document successfully', async () => {
      await expect(syncController.resetDocument({ initialDocument: 'Hello' })).resolves.toEqual({ message: 'Document reset successfully' });
      expect(changeProcessorService.resetDocument).toHaveBeenCalledWith('Hello');
    });

    it('should throw an error if resetting document fails', async () => {
      jest.spyOn(changeProcessorService, 'resetDocument').mockRejectedValue(new Error('Error resetting document'));
      await expect(syncController.resetDocument({ initialDocument: 'Hello' })).rejects.toThrow('Error resetting document');
    });
  });

  describe('applyOperation', () => {
    it('should apply operation successfully', async () => {
      const operation: ChangeDto = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };
      await expect(syncController.applyOperation({ operation })).resolves.toEqual({ message: 'Operation applied successfully' });
      expect(changeProcessorService.applyOperation).toHaveBeenCalledWith(operation);
    });

    it('should throw an error if applying operation fails', async () => {
      const operation: ChangeDto = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };
      jest.spyOn(changeProcessorService, 'applyOperation').mockRejectedValue(new Error('Error applying operation'));
      await expect(syncController.applyOperation({ operation })).rejects.toThrow('Error applying operation');
    });
  });

  describe('getDocument', () => {
    it('should retrieve the current document successfully', async () => {
      const document = 'Hello World';
      jest.spyOn(changeProcessorService, 'getDocument').mockResolvedValue(document);
      await expect(syncController.getDocument()).resolves.toEqual({ document });
      expect(changeProcessorService.getDocument).toHaveBeenCalled();
    });

    it('should throw an error if retrieving document fails', async () => {
      jest.spyOn(changeProcessorService, 'getDocument').mockRejectedValue(new Error('Error retrieving document'));
      await expect(syncController.getDocument()).rejects.toThrow('Error retrieving document');
    });
  });
});
