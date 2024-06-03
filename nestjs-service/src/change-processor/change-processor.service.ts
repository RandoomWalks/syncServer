// import { Injectable } from '@nestjs/common';
// import { DatabaseService } from '../database/database.service';
// import { Db } from 'mongodb';

// @Injectable()
// export class ChangeProcessorService {
//     constructor(private readonly databaseService: DatabaseService) { }

//     async processClientChanges(changes: any[]): Promise<void> {
//         const db: Db = await this.databaseService.getDb();
//         const collection = db.collection('your-collection');

//         for (const change of changes) {
//             switch (change.type) {
//                 case 'create':
//                     await collection.insertOne(change.data);
//                     break;
//                 case 'update':
//                     await collection.updateOne({ _id: change.data._id }, { $set: change.data });
//                     break;
//                 case 'delete':
//                     await collection.deleteOne({ _id: change.data._id });
//                     break;
//             }
//         }
//     }

//     async getServerChanges(since: Date): Promise<any[]> {
//         const db: Db = await this.databaseService.getDb();
//         const collection = db.collection('your-collection');
//         const changes = await collection.find({ updatedAt: { $gt: since } }).toArray();
//         return changes;
//     }
// }
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Db, MongoServerError, ObjectId } from 'mongodb';

import { ReceiveClientChangesReq } from '../models'

@Injectable()
export class ChangeProcessorService {
    private readonly logger = new Logger(ChangeProcessorService.name);

    constructor(private readonly databaseService: DatabaseService) { }

    async processClientChanges(changes: ReceiveClientChangesReq): Promise<void> {
        this.logger.log('Processing client changes');
        this.logger.debug(`Changes data: ${JSON.stringify(changes)}`);

        try {
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection('client-changes');

            for (const change of changes.changes) {
                try {
                    switch (change.type) {
                        case 'create':
                            this.logger.debug(`Creating document: ${JSON.stringify(change.data)}`);
                            await collection.insertOne(change.data);
                            break;
                        case 'update':
                            this.logger.debug(`Updating document with _id: ${change.data._id}`);
                            await collection.updateOne({ _id: change.data._id }, { $set: change.data });
                            break;
                        case 'delete':
                            this.logger.debug(`Deleting document with _id: ${change.data._id}`);
                            await collection.deleteOne({ _id: change.data._id });
                            break;
                        default:
                            this.logger.warn(`Unknown change type: ${change.type}`);
                    }
                } catch (error) {
                    if (error instanceof MongoServerError && error.code === 11000) {
                        this.logger.error('Duplicate key error', error);
                        // Handle duplicate key error, e.g., by updating the existing document
                        await collection.updateOne({ _id: change.data._id }, { $set: change.data });
                    } else {
                        this.logger.error('Error processing client changes', error.stack);
                        throw error;
                    }
                }
            }

            this.logger.log('Client changes processed successfully');
        } catch (error) {
            this.logger.error('Error processing client changes', error.stack);
            throw error;
        }
    }

    async getServerChanges(since: Date): Promise<any[]> {
        this.logger.log('Retrieving server changes');
        this.logger.debug(`Changes since: ${since.toISOString()}`);

        try {
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection('client-changes');
            const changes = await collection.find({ updatedAt: { $gt: since } }).toArray();

            this.logger.log('Server changes retrieved successfully');
            this.logger.debug(`Changes: ${JSON.stringify(changes)}`);
            return changes;
        } catch (error) {
            this.logger.error('Error retrieving server changes', error.stack);
            throw error;
        }
    }
}
