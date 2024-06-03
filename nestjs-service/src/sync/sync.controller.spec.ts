import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';
import { GoClientService } from './go-client.service';
import { ChangeDto } from '../models/external/change.dto';

describe('SyncController', () => {
  let controller: SyncController;
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

    controller = module.get<SyncController>(SyncController);
    changeProcessorService = module.get<ChangeProcessorService>(ChangeProcessorService);
    serverChangeTrackerService = module.get<ServerChangeTrackerService>(ServerChangeTrackerService);
    goClientService = module.get<GoClientService>(GoClientService);
  });

  it('should receive and process client changes', async () => {
    const changes: ChangeDto[] = [
      { type: 'create', data: { value: 'test' } },
    ];
    jest.spyOn(changeProcessorService, 'processClientChanges').mockResolvedValue(undefined);

    const result = await controller.receiveClientChanges(changes);

    expect(result).toEqual({ message: 'Client changes processed successfully' });
    expect(changeProcessorService.processClientChanges).toHaveBeenCalledWith(changes);
  });

  it('should handle errors while processing client changes', async () => {
    const changes: ChangeDto[] = [
      { type: 'create', data: { value: 'test' } },
    ];
    const mockError = new Error('Processing Error');
    jest.spyOn(changeProcessorService, 'processClientChanges').mockRejectedValue(mockError);

    await expect(controller.receiveClientChanges(changes)).rejects.toThrow(mockError);
    expect(changeProcessorService.processClientChanges).toHaveBeenCalledWith(changes);
  });

  it('should send server changes', async () => {
    const changes: ChangeDto[] = [
      { type: 'update', data: { value: 'test' } },
    ];
    const since = '2023-01-01T00:00:00Z';
    jest.spyOn(changeProcessorService, 'getServerChanges').mockResolvedValue(changes);

    const result = await controller.sendServerChanges(since);

    expect(result).toEqual(changes);
    expect(changeProcessorService.getServerChanges).toHaveBeenCalledWith(new Date(since));
  });

  it('should handle errors while retrieving server changes', async () => {
    const since = '2023-01-01T00:00:00Z';
    const mockError = new Error('Retrieval Error');
    jest.spyOn(changeProcessorService, 'getServerChanges').mockRejectedValue(mockError);

    await expect(controller.sendServerChanges(since)).rejects.toThrow(mockError);
    expect(changeProcessorService.getServerChanges).toHaveBeenCalledWith(new Date(since));
  });

  it('should process data via Go service', async () => {
    const data: ChangeDto[] = [
      { type: 'create', data: { value: 'test' } },
    ];
    jest.spyOn(goClientService, 'syncData').mockResolvedValue('success');

    const result = await controller.processData({ data });

    expect(result).toBe('success');
    expect(goClientService.syncData).toHaveBeenCalledWith(data);
  });

  it('should handle errors while processing data via Go service', async () => {
    const data: ChangeDto[] = [
      { type: 'create', data: { value: 'test' } },
    ];
    const mockError = new Error('Sync Error');
    jest.spyOn(goClientService, 'syncData').mockRejectedValue(mockError);

    await expect(controller.processData({ data })).rejects.toThrow(mockError);
    expect(goClientService.syncData).toHaveBeenCalledWith(data);
  });

  it('should handle empty data in process data request', async () => {
    jest.spyOn(goClientService, 'syncData').mockResolvedValue('success');

    const result = await controller.processData({ data: [] });

    expect(result).toBe('success');
    expect(goClientService.syncData).toHaveBeenCalledWith([]);
  });

  it('should handle invalid date format in send server changes', async () => {
    const invalidDate = 'invalid-date';
    jest.spyOn(changeProcessorService, 'getServerChanges').mockRejectedValue(new Error('Invalid Date'));

    await expect(controller.sendServerChanges(invalidDate)).rejects.toThrow('Invalid time value');
    expect(changeProcessorService.getServerChanges).not.toHaveBeenCalled();

    // expect(changeProcessorService.getServerChanges).toHaveBeenCalledWith(new Date(invalidDate));
  });
});
