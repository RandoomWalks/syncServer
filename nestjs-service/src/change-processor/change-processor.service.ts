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

    private isClientOutOfSync(clientVC: VectorClock): boolean {
        const serverVC = this.otDocument.getServerVC();
        return Object.entries(serverVC).some(([clientId, count]) =>
            (clientVC[clientId] || 0) < count
        );
    }

    async processClientChanges(changeDtos: ChangeDto[]): Promise<{ accepted: boolean, changes?: ChangeDto[] }> {
        this.logger.log('Processing client changes');
        this.logger.log('changeDtos:', changeDtos); // Log the received changeDtos

        const operations: Operation[] = changeDtos.map(ChangeConverter.toInternal);
        this.logger.log('operations:', operations); // Log the converted operations

        const documents: ChangeDocument[] = operations.map(ChangeConverter.toDocument);
        this.logger.log('documents:', documents); // Log the converted documents

        const clientVC = changeDtos[0].vectorClock; // Assuming all changes have the same vector clock
        if (this.isClientOutOfSync(clientVC)) {
            const missingChanges: ChangeDocument[] = await this.getChangesSinceVC(clientVC);

            return { accepted: false, changes: missingChanges.map(ChangeConverter.toExternal) };
        }

        try {
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection<ChangeDocument>('client-changes');

            // Apply operations and prepare bulk operations for the database
            const bulkOps = documents.map(doc => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: doc },
                    upsert: true,
                },
            }));

            await collection.bulkWrite(bulkOps);
            operations.forEach(op => this.otDocument.applyOperation(op));

            // this.serverVectorClock = this.otDocument.mergeVectorClocks(this.serverVectorClock, operation.vectorClock);

            bulkOps.forEach(op => {
                this.logger.log(`updatedAt for clientId ${op.updateOne.filter._id}: ${op.updateOne.update.$set.updatedAt}`);
                // this.logger.log(`${op.updateOne.update.$set.updatedAt}`)
            })

            this.logger.log('Client changes processed successfully');
        } catch (error) {
            this.logger.error('Error processing client changes', error.stack);
            throw error;
        }
    }

    async getServerChanges(since: Date, clientVC?: VectorClock): Promise<any> {
        this.logger.log('Retrieving server changes');
        try {
            this.logger.log("getServerChanges() START get changes since:", since);
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection<ChangeDocument>('client-changes');
            let changes: ChangeDocument[] = [];

            if (clientVC) {
                changes = await this.getChangesSinceVC(clientVC);

                // changes = changes.filter(change => 
                //     this.isChangeNewerThanVectorClock(change.vectorClock, clientVC)
                // );
            } else {

                // const changes: ChangeDocument[] = await collection.find({ updatedAt: { $gt: since } }).toArray() || [];
                changes = await collection
                    .find({ updatedAt: { $gt: since } })
                    .sort({ updatedAt: 1 }) // sorted chronologically, starting from the earliest.
                    .toArray() || [];
            }


            this.logger.log("getServerChanges() changes ChangeDocument[]:", changes);
            let changesObj = changes.map(doc => {
                let transformedChange = ChangeConverter.toExternal(doc);
                this.logger.log("getServerChanges() transformedChange:", transformedChange);
                return transformedChange; // returns the result of converting each ChangeDocument (doc) to a ChangeDto
            });

            // Convert the documents to ChangeDto
            return { changes: changesObj, serverVC: this.otDocument.getServerVC() };

        } catch (error) {
            this.logger.error('Error retrieving server changes', error.stack);
            throw error;
        }
    }


    private async getChangesSinceVC(clientVC: VectorClock): Promise<ChangeDocument[]> {
        const db: Db = await this.databaseService.getDb();
        const collection = db.collection<ChangeDocument>('client-changes');
        const serverVC = this.otDocument.getServerVC();

        return collection.find({
            $or: Object.entries(serverVC).map(([clientId, count]) => ({
                clientId,
                [`vectorClock.${clientId}`]: { $gt: clientVC[clientId] || 0 }
            }))
        }).sort({ updatedAt: 1 }).toArray();
    }

    private isChangeNewerThanVectorClock(changeVC: VectorClock, clientVC: VectorClock): boolean {
        return Object.entries(changeVC).some(([clientId, count]) =>
            (clientVC[clientId] || 0) < count
        );
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
