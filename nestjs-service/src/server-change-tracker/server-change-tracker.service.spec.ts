import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { ChangeDto } from '../models/external/change.dto';
import { Db } from 'mongodb';
import { ServerChangeTrackerService } from './server-change-tracker.service';

describe('ServerChangeTrackerService', () => {
    let service: ServerChangeTrackerService;
    let dbService: DatabaseService;
    let db: Db;
    let collectionMock: any;

    beforeEach(async () => {
        collectionMock = {
            insertOne: jest.fn(),
            find: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([
                    {
                        _id: '1',
                        type: 'update',
                        data: { _id: '1', name: 'test' },
                        updatedAt: new Date(),
                    },
                ]),
            }),
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
        const change: ChangeDto = { type: 'create', data: { _id: '1', name: 'test' } };
        await service.trackChange(change);

        expect(collectionMock.insertOne).toHaveBeenCalledWith(expect.objectContaining(change));
    });

    it('should retrieve changes since a timestamp', async () => {
        const timestamp = new Date();
        const changes = await service.getChangesSince(timestamp);

        expect(collectionMock.find).toHaveBeenCalledWith({ timestamp: { $gt: timestamp } });
        expect(collectionMock.find().toArray).toHaveBeenCalled();
        expect(changes).toEqual([
            {
                _id: '1',
                type: 'update',
                data: { _id: '1', name: 'test' },
                updatedAt: expect.any(Date),
            },
        ]);
    });
});
