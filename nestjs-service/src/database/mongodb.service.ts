import { Injectable, Logger } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { IDatabaseService } from './database.interface';

@Injectable()
export class MongoDBService implements IDatabaseService {
    private db: Db;
    private client: MongoClient;
    private readonly logger = new Logger(MongoDBService.name);

    async connect(): Promise<void> {
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
            await this.connect();
        }
        return this.db;
    }

    async close(): Promise<void> {
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

    async insertOne(collectionName: string, document: any): Promise<void> {
        const db = await this.getDb();
        await db.collection(collectionName).insertOne(document);
    }

    async updateOne(collectionName: string, filter: any, update: any): Promise<void> {
        const db = await this.getDb();
        await db.collection(collectionName).updateOne(filter, update);
    }

    async deleteOne(collectionName: string, filter: any): Promise<void> {
        const db = await this.getDb();
        await db.collection(collectionName).deleteOne(filter);
    }

    async find(collectionName: string, query: any): Promise<any[]> {
        const db = await this.getDb();
        return db.collection(collectionName).find(query).toArray();
    }
}
