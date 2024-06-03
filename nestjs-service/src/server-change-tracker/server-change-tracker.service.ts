// import { Injectable } from '@nestjs/common';
// import { DatabaseService } from '../database/database.service';

// @Injectable()
// export class ServerChangeTrackerService {
//     constructor(private readonly databaseService: DatabaseService) { }

//     async trackChange(change: any): Promise<void> {
//         const db = await this.databaseService.getDb();
//         const collection = db.collection('change-tracker');
//         await collection.insertOne(change);
//     }

//     async getChangesSince(timestamp: Date): Promise<any[]> {
//         const db = await this.databaseService.getDb();
//         const collection = db.collection('change-tracker');
//         const changes = await collection.find({ timestamp: { $gt: timestamp } }).toArray();
//         return changes;
//     }
// }

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ServerChangeTrackerService {
    private readonly logger = new Logger(ServerChangeTrackerService.name);

    constructor(private readonly databaseService: DatabaseService) {}

    async trackChange(change: any): Promise<void> {
        this.logger.log('Tracking change');
        this.logger.debug(`Change data: ${JSON.stringify(change)}`);

        try {
            const db = await this.databaseService.getDb();
            const collection = db.collection('change-tracker');
            await collection.insertOne(change);
            this.logger.log('Change tracked successfully');
        } catch (error) {
            this.logger.error('Error tracking change', error.stack);
            throw error;
        }
    }

    async getChangesSince(timestamp: Date): Promise<any[]> {
        this.logger.log('Retrieving changes since timestamp');
        this.logger.debug(`Timestamp: ${timestamp.toISOString()}`);

        try {
            const db = await this.databaseService.getDb();
            const collection = db.collection('change-tracker');
            const changes = await collection.find({ timestamp: { $gt: timestamp } }).toArray();
            this.logger.log('Changes retrieved successfully');
            this.logger.debug(`Changes: ${JSON.stringify(changes)}`);
            return changes;
        } catch (error) {
            this.logger.error('Error retrieving changes', error.stack);
            throw error;
        }
    }
}
