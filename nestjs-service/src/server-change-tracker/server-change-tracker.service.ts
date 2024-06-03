import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Change } from '../models/internal/change.model';
import { ChangeDto } from '../models/external/change.dto';
import { ChangeConverter } from '../converters/change.converter';

@Injectable()
export class ServerChangeTrackerService {
    private readonly logger = new Logger(ServerChangeTrackerService.name);

    constructor(private readonly databaseService: DatabaseService) {}

    async trackChange(changeDto: ChangeDto): Promise<void> {
        this.logger.log('Tracking change');
        const change: Change = ChangeConverter.toInternal(changeDto);

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

    async getChangesSince(timestamp: Date): Promise<ChangeDto[]> {
        this.logger.log('Retrieving changes since timestamp');
        try {
            const db = await this.databaseService.getDb();
            const collection = db.collection('change-tracker');
            const changes = await collection.find({ timestamp: { $gt: timestamp } }).toArray();
            if (!changes) {
                throw new Error('Failed to retrieve changes from the database');
            }
            return changes.map((doc) => {
                const change: Change = {
                    _id: doc._id,
                    type: doc.type,
                    data: doc.data,
                    updatedAt: doc.updatedAt,
                };
                return ChangeConverter.toExternal(change);
            });
        } catch (error) {
            this.logger.error('Error retrieving changes', error.stack);
            throw error;
        }
    }
}
