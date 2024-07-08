import { ObjectId } from 'mongodb';
import { OTDocument, Operation,VectorClock } from '../../crdt/ot-document.model';

// models/external/change.dto.ts

export interface ChangeDto {
  type: "insert" | "delete";
  position: number;
  vectorClock: VectorClock;
  clientId: string;
  text?: string;
  length?: number;
  updatedAt?: Date;
}
