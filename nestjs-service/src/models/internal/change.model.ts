import { ObjectId } from 'mongodb';
import { OTDocument, Operation,VectorClock } from '../../crdt/ot-document.model';


// Define the type of document stored in MongoDB
export interface ChangeDocument {
    _id: ObjectId;
    type: "insert" | "delete";
    position: number;
    vectorClock: VectorClock;
    clientId: string;
    text?: string;
    length?: number;
    updatedAt: Date; // Date object for MongoDB
  }