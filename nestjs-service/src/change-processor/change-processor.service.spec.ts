import { Test, TestingModule } from '@nestjs/testing';
import { ChangeProcessorService } from './change-processor.service';
import { DatabaseService } from '../database/database.service';
import { Db } from 'mongodb';

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
        const changes = [
            { type: 'create', data: { _id: 1, name: 'test' } },
            { type: 'update', data: { _id: 1, name: 'updated' } },
            { type: 'delete', data: { _id: 1 } },
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
        await service.getServerChanges(since);

        expect(collectionMock.find).toHaveBeenCalledWith({ updatedAt: { $gt: since } });
        expect(collectionMock.find().toArray).toHaveBeenCalled();
    });
});
