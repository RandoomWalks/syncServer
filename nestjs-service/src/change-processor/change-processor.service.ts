import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Db } from 'mongodb';

@Injectable()
export class ChangeProcessorService {
  constructor(private readonly databaseService: DatabaseService) {}

  async processClientChanges(changes: any[]): Promise<void> {
    const db: Db = await this.databaseService.getDb();
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

  async getServerChanges(since: Date): Promise<any[]> {
    const db: Db = await this.databaseService.getDb();
    const collection = db.collection('your-collection');
    const changes = await collection.find({ updatedAt: { $gt: since } }).toArray();
    return changes;
  }
}
