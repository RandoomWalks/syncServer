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

    // async resetDocument(initialDocument: string): Promise<void> {
    //     this.logger.log('Resetting document');
    //     this.otDocument = new OTDocument(initialDocument);
    //     // Optional: Save the initial document state to the database if needed
    // }

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

    async getOTDocument(): Promise<OTDocument> {
        this.logger.log('Getting current document');
        return this.otDocument;
    }

private isClientOutOfSync(clientVC: VectorClock): boolean {
    const serverVC = this.otDocument.getServerVC();
    for (const clientId in serverVC) {
        if ((clientVC[clientId] || 0) < serverVC[clientId]) {
            return true;
        }
    }
    for (const clientId in clientVC) {
        if ((serverVC[clientId] || 0) < clientVC[clientId]) {
            return true;
        }
    }
    return false;
}
    async clearDatabase(): Promise<void> {
        const db: Db = await this.databaseService.getDb();
        await db.collection('client-changes').deleteMany({});
        this.otDocument = new OTDocument('');
    }

    async resetDocument(initialContent: string = ''): Promise<void> {
        this.otDocument = new OTDocument(initialContent);
        // You might want to persist this initial state to the database
        // depending on your application's requirements
    }

    async processClientChanges(changeDtos: ChangeDto[]): Promise<{ accepted: boolean, changes?: ChangeDto[] }> {
        this.logger.log('Processing client changes');
        this.logger.log('changeDtos:', JSON.stringify(changeDtos, null, 2));

        try {
            if (!Array.isArray(changeDtos) || changeDtos.length === 0) {
                throw new Error('Invalid or empty changeDtos array');
            }

            const operations: Operation[] = changeDtos.map(ChangeConverter.toInternal);
            this.logger.log('operations:', JSON.stringify(operations, null, 2));

            const documents: ChangeDocument[] = operations.map(ChangeConverter.toDocument);
            this.logger.log('documents:', JSON.stringify(documents, null, 2));

            const clientVC = changeDtos[0].vectorClock;
            if (!clientVC || Object.keys(clientVC).length === 0) {
                throw new Error('Invalid or empty client vector clock');
            }

            if (this.isClientOutOfSync(clientVC)) {
                const missingChanges: ChangeDocument[] = await this.getChangesSinceVC(clientVC);
                return { accepted: false, changes: missingChanges.map(ChangeConverter.toExternal) };
            }

            const db: Db = await this.databaseService.getDb();
            const session = this.databaseService.getClient().startSession();

            try {
                await session.withTransaction(async () => {
                    const collection = db.collection<ChangeDocument>('client-changes');

                    const bulkOps = documents.map(doc => ({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: { $set: doc },
                            upsert: true,
                        },
                    }));

                    await collection.bulkWrite(bulkOps, { session });
                    operations.forEach(op => this.otDocument.applyOperation(op));

                    bulkOps.forEach(op => {
                        this.logger.log(`updatedAt for clientId ${op.updateOne.filter._id}: ${op.updateOne.update.$set.updatedAt}`);
                    });
                });

                this.logger.log('Client changes processed successfully, server doc:', await this.getDocument());
                return { accepted: true };
            } finally {
                await session.endSession();
            }
        } catch (error) {
            this.logger.error('Error processing client changes', error);
            throw error;
        }
    }
    async getServerChanges(since: Date, clientVC?: VectorClock): Promise<any> {
        this.logger.log('Retrieving server changes');
        this.logger.log("getServerChanges() START get changes since:", since);
        this.logger.log("Client vector clock:", JSON.stringify(clientVC, null, 2));

        try {
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection<ChangeDocument>('client-changes');
            let changes: ChangeDocument[] = [];

            if (clientVC && Object.keys(clientVC).length > 0) {
                changes = await this.getChangesSinceVC(clientVC);
            } else {
                changes = await collection
                    .find({ updatedAt: { $gt: since } })
                    .sort({ updatedAt: 1 })
                    .toArray() || [];
            }

            this.logger.log("getServerChanges() changes ChangeDocument[]:", JSON.stringify(changes, null, 2));
            let changesObj = changes.map(doc => ChangeConverter.toExternal(doc));

            const serverVC = this.otDocument.getServerVC();
            this.logger.log("Current server vector clock:", JSON.stringify(serverVC, null, 2));

            return { changes: changesObj, serverVC };
        } catch (error) {
            this.logger.error('Error retrieving server changes', error);
            throw error;
        }
    }

    private async getChangesSinceVC(clientVC: VectorClock): Promise<ChangeDocument[]> {
        // this.logger.log('getChangesSinceVC called with clientVC:', clientVC);
        this.logger.log('getChangesSinceVC called with clientVC: ' + JSON.stringify(clientVC, null, 2));

        try {
            const db: Db = await this.databaseService.getDb();
            if (!db) {
                throw new Error('Failed to obtain database connection');
            }
            this.logger.log('Database connection obtained.');

            const collection = db.collection<ChangeDocument>('client-changes');
            if (!collection) {
                throw new Error('Failed to select collection "client-changes"');
            }
            this.logger.log('Collection "client-changes" selected.');

            const serverVC = this.otDocument.getServerVC();
            if (!serverVC || Object.keys(serverVC).length < 1) {
                this.logger.error('Server vector clock is not defined or empty');
                throw new Error('Server vector clock is not defined or empty');
            }
            this.logger.log('Server vector clock obtained:', serverVC);

            // Ensure client's vector clock is considered
            for (const clientId in clientVC) {
                if (!serverVC[clientId] || clientVC[clientId] > serverVC[clientId]) {
                    serverVC[clientId] = clientVC[clientId];
                }
            }
            await this.otDocument.setServerVectorClock(serverVC);

            /*
            query is used to find documents where the vector clock for any client in serverVC is greater than the corresponding value in clientVC.
            clientVC[clientId] || 0 ensures that if clientVC[clientId] is undefined or falsy, it defaults to 0.

            Example with the following vector clocks:

                const serverVC = {
                    client1: 5,
                    client2: 3
                };

                const clientVC = {
                    client1: 4,
                    client2: 2
                };

                The .map() function would transform each pair:

                [
                    { clientId: 'client1', 'vectorClock.client1': { $gt: 4 } },
                    { clientId: 'client2', 'vectorClock.client2': { $gt: 2 } }
                ]

                Object.entries(serverVC) would produce:
                [['client1', 5], ['client2', 3]]
            */

            // const query = {
            //     $or: Object.entries(serverVC).map(([clientId, count]) => ({
            //         clientId,
            //         [`vectorClock.${clientId}`]: { $gt: clientVC[clientId] || 0 }
            //     }))
            // };
            const query = {
                $or: [
                    ...Object.entries(serverVC).map(([clientId, count]) => ({
                        clientId,
                        [`vectorClock.${clientId}`]: { $gt: clientVC[clientId] || 0 }
                    })),
                    ...Object.keys(clientVC).filter(clientId => !(clientId in serverVC)).map(clientId => ({
                        clientId,
                        [`vectorClock.${clientId}`]: { $exists: true }
                    }))
                ]
            };
            this.logger.log('Query constructed:', JSON.stringify(query));

            const changes = await collection.find(query).sort({ updatedAt: 1 }).toArray();
            if (!changes) {
                throw new Error('Failed to retrieve changes from collection');
            }
            this.logger.log('Changes retrieved:', JSON.stringify(changes, null, 2));

            return changes;
        } catch (error) {
            this.logger.error('Error in getChangesSinceVC:', error);
            throw new Error('Failed to retrieve changes since vector clock');
        }
    }



    // private async getChangesSinceVC(clientVC: VectorClock): Promise<ChangeDocument[]> {
    //     const db: Db = await this.databaseService.getDb();
    //     const collection = db.collection<ChangeDocument>('client-changes');
    //     const serverVC = this.otDocument.getServerVC();

    //     return collection.find({
    //         $or: Object.entries(serverVC).map(([clientId, count]) => ({
    //             clientId,
    //             [`vectorClock.${clientId}`]: { $gt: clientVC[clientId] || 0 }
    //         }))
    //     }).sort({ updatedAt: 1 }).toArray();
    // }

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
