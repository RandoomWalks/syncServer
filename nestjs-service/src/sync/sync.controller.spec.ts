import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';

describe('SyncController', () => {
  let controller: SyncController;
  let changeProcessorService: ChangeProcessorService;
  let serverChangeTrackerService: ServerChangeTrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: ChangeProcessorService,
          useValue: {
            processClientChanges: jest.fn(),
            getServerChanges: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ServerChangeTrackerService,
          useValue: {
            trackChange: jest.fn(),
            getChangesSince: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    changeProcessorService = module.get<ChangeProcessorService>(ChangeProcessorService);
    serverChangeTrackerService = module.get<ServerChangeTrackerService>(ServerChangeTrackerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process client changes', async () => {
    const changes = [{ type: 'create', data: { _id: 1, name: 'test' } }];
    await controller.receiveClientChanges(changes);

    expect(changeProcessorService.processClientChanges).toHaveBeenCalledWith(changes);
  });

  it('should send server changes', async () => {
    const since = '2023-01-01T00:00:00Z';
    await controller.sendServerChanges(since);

    expect(changeProcessorService.getServerChanges).toHaveBeenCalledWith(new Date(since));
  });
});
