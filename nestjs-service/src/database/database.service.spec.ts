import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { MongoClient } from 'mongodb';

jest.mock('mongodb', () => {
    const mClient = {
        connect: jest.fn(),
        db: jest.fn().mockReturnThis(),
    };
    return { MongoClient: jest.fn(() => mClient) };
});

describe('DatabaseService', () => {
    let service: DatabaseService;
    let client: MongoClient;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DatabaseService],
        }).compile();

        service = module.get<DatabaseService>(DatabaseService);
            client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
        // client = new MongoClient() as any;
    });

      afterAll(async () => {
    await client.close();
  });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should connect to the database on module init', async () => {
        await service.onModuleInit();
        expect(client.connect).toHaveBeenCalled();
        expect(client.db).toHaveBeenCalledWith('mydb');
    });

    it('should throw an error if getDb is called before init', () => {
        expect(() => service.getDb()).toThrow('Database connection is not initialized.');
    });

    it('should return the database instance after init', async () => {
        await service.onModuleInit();
        const db = service.getDb();
        expect(db).toBeDefined();
    });
});
