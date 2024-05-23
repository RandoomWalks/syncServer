// database.service.ts: Contains the DatabaseService that manages MongoDB connection and operations.


// In NestJS, the @Injectable() decorator is used to define a service that can be injected into other parts of the application, and OnModuleInit is an interface that can be implemented to perform initialization logic when the module is initialized. Here's a breakdown and a concrete example to illustrate their usage:



import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

import { User } from '../core/domain/models/user.model';
import { UserRepository } from '../core/domain/repositories/user.repository';


/**
 * DatabaseService handles the MongoDB connection and provides methods for database operations.
 * Implements OnModuleInit to establish a database connection when the module is initialized.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, UserRepository {
    private db: Db;

    async onModuleInit(): Promise<void> {
        const client = new MongoClient('mongodb://localhost:27017');
        await client.connect();
        this.db = client.db('mydb');
    }

    getDb(): Db {
        return this.db;
    }

    findById(id: string): Promise<User | null> {

    }
    findByUsername(username: string): Promise<User | null> {

    }
    findByEmail(email: string): Promise<User | null> {

    }
    createUser(user: User): Promise<User> {

    }
    updateUser(id: string, user: Partial<User>): Promise<User | null> {

    }
    deleteUser(id: string): Promise<boolean> {

    }

    // Additional methods for database operations can be added here
}
