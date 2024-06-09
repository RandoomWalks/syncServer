
// import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { MongoClient, Db } from 'mongodb';

// @Injectable()
// export class DatabaseService implements OnModuleInit, OnModuleDestroy {
//     private db: Db;
//     private client: MongoClient;
//     private readonly logger = new Logger(DatabaseService.name);

//     async onModuleInit(): Promise<void> {
//         const uri = process.env.DATABASE_URL || 'mongodb://mongo:27017/mydb';
//         this.logger.log(`Connecting to MongoDB at ${uri}`);
        
//         try {
//             this.client = new MongoClient(uri);
//             await this.client.connect();
//             this.db = this.client.db('mydb');
//             this.logger.log('Successfully connected to MongoDB');
//         } catch (error) {
//             this.logger.error('Error connecting to MongoDB', error.stack);
//             throw error;
//         }
//     }

//     getDb(): Db {
//         if (!this.db) {
//             throw new Error('Database connection is not initialized.');
//         }
//         return this.db;
//     }

//     async onModuleDestroy(): Promise<void> {
//         if (this.client) {
//             this.logger.log('Closing MongoDB connection');
//             try {
//                 await this.client.close();
//                 this.logger.log('MongoDB connection closed successfully');
//             } catch (error) {
//                 this.logger.error('Error closing MongoDB connection', error.stack);
//             }
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

            // Ensure indexes are created
            await this.createIndexes();
        } catch (error) {
            this.logger.error('Error connecting to MongoDB', error.stack);
            throw error;
        }
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
        await collection.createIndex({ 'data._id': 1 });
    }
}
