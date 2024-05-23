import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * ServerChangeTrackerService tracks changes on the server and prepares them for synchronization with the client.
 * It uses DatabaseService to perform operations on the MongoDB database.
 */
@Injectable()
export class ServerChangeTrackerService {
    constructor(private readonly databaseService: DatabaseService) { }

    /**
     * Tracks a change by inserting it into the change-tracker collection.
     * @param change - The change to be tracked
     */
    async trackChange(change: any): Promise<void> {
        const db = this.databaseService.getDb();
        const collection = db.collection('change-tracker');
        await collection.insertOne(change);
    }

    /**
     * Retrieves changes since the specified timestamp.
     * @param timestamp - The timestamp from which to retrieve changes
     * @returns List of changes
     */
    async getChangesSince(timestamp: Date): Promise<any[]> {
        const db = this.databaseService.getDb();
        const collection = db.collection('change-tracker');
        const changes = await collection.find({ timestamp: { $gt: timestamp } }).toArray();
        return changes;
    }
}
