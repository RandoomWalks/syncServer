// services/change-processor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ChangeDocument } from '../models/internal/change.model';
import { ChangeConverter } from '../converters/change.converter';
import { ChangeDto } from '../models/external/change.dto';
import { Db, MongoServerError, ObjectId, WithId } from 'mongodb';
import { OTDocument, Operation, VectorClock } from '../crdt/ot-document.model';

@Injectable()
export class ChangeProcessorService {
    private readonly logger = new Logger(ChangeProcessorService.name);
    private otDocument: OTDocument;

    constructor(private readonly databaseService: DatabaseService) {
        // Initialize OTDocument with an empty document or load the initial state from the database
        this.otDocument = new OTDocument('');
    }
    
    async resetDocument(initialDocument: string): Promise<void> {
        this.logger.log('Resetting document');
        this.otDocument = new OTDocument(initialDocument);
        // Optional: Save the initial document state to the database if needed
    }

    async applyOperation(operation: ChangeDto): Promise<void> {
        this.logger.log('Applying operation');
        const internalOperation = ChangeConverter.toInternal(operation);
        this.otDocument.applyOperation(internalOperation);
        // Optional: Save the operation to the database if needed
    }

    async getDocument(): Promise<string> {
        this.logger.log('Getting current document');
        return this.otDocument.getDocument();
    }


    async processClientChanges(changeDtos: ChangeDto[]): Promise<void> {
        this.logger.log('Processing client changes');
        console.log('changeDtos:', changeDtos); // Log the received changeDtos

        const operations: Operation[] = changeDtos.map(ChangeConverter.toInternal);
        console.log('operations:', operations); // Log the converted operations

        try {
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection<ChangeDocument>('client-changes');

            // Apply operations and prepare bulk operations for the database
            const bulkOps = operations.map(operation => {
                // Ensure clientId is a valid ObjectId
                let clientId;
                if (ObjectId.isValid(operation.clientId)) {
                    clientId = new ObjectId(operation.clientId);
                } else {
                    this.logger.warn(`Invalid ObjectId format for clientId: ${operation.clientId}, generating a new ObjectId`);

                    clientId = new ObjectId(); // Generate a valid ObjectId if necessary
                    // throw new Error(`Invalid ObjectId format for clientId: ${operation.clientId}`);
                }

                this.otDocument.applyOperation(operation);

                return {
                    updateOne: {
                        filter: { _id: clientId },
                        update: { $set: { ...operation, clientId, vectorClock: operation.vectorClock } },
                        upsert: true,
                    },
                };
            });

            await collection.bulkWrite(bulkOps);

            this.logger.log('Client changes processed successfully');
        } catch (error) {
            this.logger.error('Error processing client changes', error.stack);
            throw error;
        }
    }

    async getServerChanges(since: Date): Promise<ChangeDto[]> {
        this.logger.log('Retrieving server changes');
        try {
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection<ChangeDocument>('client-changes');
            const changes: ChangeDocument[] = await collection.find({ updatedAt: { $gt: since } }).toArray() || [];
            
            // Convert the documents to ChangeDto
            return changes.map(doc => {
                return ChangeConverter.toExternal(doc);
            });
        } catch (error) {
            this.logger.error('Error retrieving server changes', error.stack);
            throw error;
        }
    }

    private generateVectorClock(): VectorClock {
        // Replace with your client ID logic, ensuring it is a valid ObjectId
        let clientId = 'client-1'; // Example, replace with actual logic
        if (!ObjectId.isValid(clientId)) {
            clientId = new ObjectId().toString(); // Generate a valid ObjectId if necessary
        }
        const timestamp = Date.now();
        return { [clientId]: timestamp };
    }
}
