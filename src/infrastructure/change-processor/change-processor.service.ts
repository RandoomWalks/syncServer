import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * ChangeProcessorService processes changes received from the client and manages synchronization logic.
 * It uses DatabaseService to perform operations on the MongoDB database.
 */
@Injectable()
export class ChangeProcessorService {
    constructor(private readonly databaseService: DatabaseService) { }

    /**
     * Processes client changes by performing the corresponding database operations.
     * @param changes - List of changes from the client
     */
    async processClientChanges(changes: any[]): Promise<void> {
        const db = this.databaseService.getDb();
        const collection = db.collection('your-collection');

        for (const change of changes) {
            switch (change.type) {
                case 'create':
                    await collection.insertOne(change.data);
                    break;
                case 'update':
                    await collection.updateOne({ _id: change.data._id }, { $set: change.data });
                    break;
                case 'delete':
                    await collection.deleteOne({ _id: change.data._id });
                    break;
            }
        }
    }

    /**
     * Retrieves server changes since the specified date.
     * @param since - The date from which to retrieve changes
     * @returns List of changes
     */
    async getServerChanges(since: Date): Promise<any[]> {
        const db = this.databaseService.getDb();
        const collection = db.collection('your-collection');
        const changes = await collection.find({ updatedAt: { $gt: since } }).toArray();
        return changes;
    }
}
