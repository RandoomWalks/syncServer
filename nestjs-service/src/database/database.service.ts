// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { MongoClient, Db } from 'mongodb';

// @Injectable()
// export class DatabaseService implements OnModuleInit, OnModuleDestroy {
//     private db: Db;
//     private client: MongoClient;

//     async onModuleInit(): Promise<void> {
//         this.client = new MongoClient('mongodb://localhost:27017');
//         await this.client.connect();
//         this.db = this.client.db('mydb');
//     }

//     async getDb(): Promise<Db> {
//         if (!this.db) {
//             await this.onModuleInit();
//         }
//         return this.db;
//     }

//     async onModuleDestroy(): Promise<void> {
//         if (this.client) {
//             await this.client.close();
//         }
//     }
// }


// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { MongoClient, Db } from 'mongodb';

// @Injectable()
// export class DatabaseService implements OnModuleInit, OnModuleDestroy {
//     private db: Db;
//     private client: MongoClient;

//     async onModuleInit(): Promise<void> {
//         const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydb';
//         this.client = new MongoClient(uri);
//         await this.client.connect();
//         this.db = this.client.db('mydb');
//     }

//     async getDb(): Promise<Db> {
//         if (!this.db) {
//             await this.onModuleInit();
//         }
//         return this.db;
//     }

//     async onModuleDestroy(): Promise<void> {
//         if (this.client) {
//             await this.client.close();
//         }
//     }
// }

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private db: Db;
    private client: MongoClient;
    private readonly logger = new Logger(DatabaseService.name);

    async onModuleInit(): Promise<void> {
        const uri = process.env.DATABASE_URL || 'mongodb://mongo:27017/mydb';
        this.logger.log(`Connecting to MongoDB at ${uri}`);
        
        try {
            this.client = new MongoClient(uri);
            await this.client.connect();
            this.db = this.client.db('mydb');
            this.logger.log('Successfully connected to MongoDB');
        } catch (error) {
            this.logger.error('Error connecting to MongoDB', error.stack);
            throw error;
        }
    }

    async getDb(): Promise<Db> {
        if (!this.db) {
            this.logger.warn('Database connection not initialized, initializing now...');
            await this.onModuleInit();
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
}
