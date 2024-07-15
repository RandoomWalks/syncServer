import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { ConfigService } from '@nestjs/config';
// import * as dns from 'dns';

// dns.setServers(['8.8.8.8', '1.1.1.1']);


@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private db: Db;
    private client: MongoClient;
    private readonly logger = new Logger(DatabaseService.name);

    constructor(private configService: ConfigService) {
        const uri = this.configService.get<string>('MONGO_URI');
        // const uri = "mongodb://ab4745802:E1XuVmfq825LfV9o@cluster0-shard-00-00.mongodb.net:27017,cluster0-shard-00-01.mongodb.net:27017,cluster0-shard-00-02.mongodb.net:27017/mydb?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";

        this.client = new MongoClient(uri);
        // this.client = new MongoClient(this.configService.get<string>('MONGO_URI'));
    }


    async onModuleInit(): Promise<void> {
        // const uri = process.env.LOCAL_DATABASE_URL || 'mongodb://mongo:27017/mydb';
        const uri = this.configService.get<string>('MONGO_URI');
        // const uri  ="mongodb://ab4745802:E1XuVmfq825LfV9o@cluster0-shard-00-00.mongodb.net:27017,cluster0-shard-00-01.mongodb.net:27017,cluster0-shard-00-02.mongodb.net:27017/mydb?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";

        this.logger.log(`Connecting to MongoDB at ${uri}`);

        try {
            // this.client = new MongoClient(uri);
            await this.client.connect();
            this.db = this.client.db('mydb');
            this.logger.log('Successfully connected to MongoDB');
            console.log('Connected to MongoDB');

            // Ensure indexes are created
            await this.createIndexes();
        } catch (error) {
            this.logger.error('Error connecting to MongoDB', error.stack);
            throw error;
        }
    }

    getClient():MongoClient {
        if (!this.client) {
            throw new Error('MongoClient is not initialized.');
        }
        return this.client;
    }
    
    getDb(): Db {
        if (!this.db) {
            throw new Error('Database connection is not initialized.');
        }
        return this.db;
    }

    async onModuleDestroy(): Promise<void> {
        if (this.client) {
            this.logger.log('Closing MongoDB connection');
            try {
                await this.client.close();
                this.logger.log('MongoDB connection closed successfully');
            } catch (error) {
                this.logger.error('Error closing MongoDB connection', error.stack);
            }
        }
    }

    private async createIndexes(): Promise<void> {
        const collection = this.db.collection('client-changes');
        await collection.createIndex({ updatedAt: 1 });
        await collection.createIndex({ clientId: 1 });
    }
}


// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { MongoClient } from 'mongodb';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class DatabaseService implements OnModuleInit, OnModuleDestroy {
//     private client: MongoClient;
//     private db: any;

//     constructor(private configService: ConfigService) {
//         this.client = new MongoClient(this.configService.get<string>('MONGO_URI'));
//     }

//     async onModuleInit() {
//         await this.client.connect();
//         this.db = this.client.db();
//         console.log('Connected to MongoDB');
//     }

//     getDb() {
//         return this.db;
//     }

//     async onModuleDestroy() {
//         await this.client.close();
//     }
// }
