import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ServerChangeTrackerService {
  constructor(private readonly databaseService: DatabaseService) {}

  async trackChange(change: any): Promise<void> {
    const db = await this.databaseService.getDb();
    const collection = db.collection('change-tracker');
    await collection.insertOne(change);
  }

  async getChangesSince(timestamp: Date): Promise<any[]> {
    const db = await this.databaseService.getDb();
    const collection = db.collection('change-tracker');
    const changes = await collection.find({ timestamp: { $gt: timestamp } }).toArray();
    return changes;
  }
}
