
// // services/change-processor.service.ts
// import { Injectable, Logger } from '@nestjs/common';
// import { DatabaseService } from '../database/database.service';
// import { Change } from '../models/internal/change.model';
// import { ChangeConverter } from '../converters/change.converter';
// import { ChangeDto } from '../models/external/change.dto';
// import { Db, MongoServerError } from 'mongodb';

// @Injectable()
// export class ChangeProcessorService {
//     private readonly logger = new Logger(ChangeProcessorService.name);

//     constructor(private readonly databaseService: DatabaseService) { }

//     async processClientChanges(changeDtos: ChangeDto[]): Promise<void> {
//         this.logger.log('Processing client changes');
//         const changes: Change[] = changeDtos.map(ChangeConverter.toInternal);

//         try {
//             const db: Db = await this.databaseService.getDb();
//             const collection = db.collection('client-changes');

//             for (const change of changes) {
//                 try {
//                     switch (change.type) {
//                         case 'create':
//                             this.logger.debug(`Creating document: ${JSON.stringify(change.data)}`);
//                             await collection.insertOne(change.data);
//                             break;
//                         case 'update':
//                             this.logger.debug(`Updating document with _id: ${change.data._id}`);
//                             await collection.updateOne({ _id: change.data._id }, { $set: change.data });
//                             break;
//                         case 'delete':
//                             this.logger.debug(`Deleting document with _id: ${change.data._id}`);
//                             await collection.deleteOne({ _id: change.data._id });
//                             break;
//                         default:
//                             this.logger.warn(`Unknown change type: ${change.type}`);
//                     }
//                 } catch (error) {
//                     if (error instanceof MongoServerError && error.code === 11000) {
//                         this.logger.error('Duplicate key error', error);
//                         await collection.updateOne({ _id: change.data._id }, { $set: change.data });
//                     } else {
//                         this.logger.error('Error processing client changes', error.stack);
//                         throw error;
//                     }
//                 }
//             }

//             this.logger.log('Client changes processed successfully');
//         } catch (error) {
//             this.logger.error('Error processing client changes', error.stack);
//             throw error;
//         }
//     }

//     async getServerChanges(since: Date): Promise<ChangeDto[]> {
//         this.logger.log('Retrieving server changes');
//         try {
//             const db: Db = await this.databaseService.getDb();
//             const collection = db.collection('client-changes');
//             //   const changes = await collection.find({ updatedAt: { $gt: since } }).toArray();
//             const changes = await collection.find({ updatedAt: { $gt: since } }).toArray() || []; // Handle undefined case

//             return changes.map(ChangeConverter.toExternal);
//         } catch (error) {
//             this.logger.error('Error retrieving server changes', error.stack);
//             throw error;
//         }
//     }
// }



// services/change-processor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ChangeDocument } from '../models/internal/change.model';
import { ChangeConverter } from '../converters/change.converter';
import { ChangeDto } from '../models/external/change.dto';
import { Db, MongoServerError, ObjectId, WithId } from 'mongodb';


import { OTDocument, Operation, VectorClock } from '../crdt/ot-document.model';
 
// // Define the type of document stored in MongoDB
// export interface ChangeDocument {
//     _id: ObjectId;
//     type: "insert" | "delete";
//     position: number;
//     vectorClock: VectorClock;
//     clientId: string;
//     text?: string;
//     length?: number;
//     updatedAt: Date;
//   }

  
@Injectable()
export class ChangeProcessorService {
    private readonly logger = new Logger(ChangeProcessorService.name);
    private otDocument: OTDocument;

    constructor(private readonly databaseService: DatabaseService) {
        // Initialize OTDocument with an empty document or load the initial state from the database
        this.otDocument = new OTDocument('');
    }

    async processClientChanges(changeDtos: ChangeDto[]): Promise<void> {
        this.logger.log('Processing client changes');
        const operations: Operation[] = changeDtos.map(ChangeConverter.toInternal);

        try {
            const db: Db = await this.databaseService.getDb();
            const collection = db.collection<ChangeDocument>('client-changes');

            // Apply operations and prepare bulk operations for the database
            const bulkOps = operations.map(operation => {
                this.otDocument.applyOperation(operation);

                return {
                    updateOne: {
                        filter: { _id: new ObjectId(operation.clientId) },
                        update: { $set: { ...operation, vectorClock: operation.vectorClock } },
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
        const clientId = 'client-1'; // Replace with your client ID logic
        const timestamp = Date.now();
        return { [clientId]: timestamp };
    }
}


// export class ChangeConverter {
//     static toInternal(changeDto: ChangeDto): Operation {
//       return {
//         type: changeDto.type,
//         position: changeDto.position,
//         vectorClock: changeDto.vectorClock,
//         clientId: changeDto.clientId,
//         ...(changeDto.text && { text: changeDto.text }),
//         ...(changeDto.length && { length: changeDto.length }),
//       };
//     }
  
//     static toExternal(doc: ChangeDocument): ChangeDto {
//       return {
//         type: doc.type,
//         position: doc.position,
//         vectorClock: doc.vectorClock,
//         clientId: doc.clientId,
//         text: doc.text,
//         length: doc.length,
//       };
//     }    
//   }