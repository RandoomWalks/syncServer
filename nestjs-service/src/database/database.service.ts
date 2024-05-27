import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Db;
  private client: MongoClient;

  async onModuleInit(): Promise<void> {
    this.client = new MongoClient('mongodb://localhost:27017');
    await this.client.connect();
    this.db = this.client.db('mydb');
  }

  async getDb(): Promise<Db> {
    if (!this.db) {
      await this.onModuleInit();
    }
    return this.db;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }
}
