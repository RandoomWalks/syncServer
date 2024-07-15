// import { VectorClock, Operation } from './ot.model';
import { Controller, Post, Body, Get, Query, Logger, ValidationPipe, BadRequestException } from '@nestjs/common';


export interface VectorClock {
  [clientId: string]: number;
}

export interface Operation {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
  vectorClock: VectorClock;
  clientId: string;
  updatedAt: string; // ISO 8601 string
}

export class OTDocument {
  private doc: string;
  private operations: Operation[];
  private serverVectorClock: VectorClock;
  private readonly logger = new Logger(OTDocument.name);

  constructor(initialDoc: string) {
    this.doc = initialDoc;
    this.operations = [];
    this.serverVectorClock = {} as VectorClock; // [clientId: string]: number;
    this.logger.log("Initialized OTDocument with doc:", initialDoc);
  }

  // Function to merge vector clocks
  // public mergeVectorClocks(vc1: VectorClock, vc2: VectorClock): VectorClock {
  //   // this.logger.log('getChangesSinceVC called with clientVC: ' + JSON.stringify(clientVC, null, 2) );
  //   this.logger.log("Merging vector clocks:", JSON.stringify(vc1, null, 2), JSON.stringify(vc2, null, 2));
  //   const merged: VectorClock = { ...vc1 };
  //   for (const clientId in vc2) {
  //     merged[clientId] = Math.max(merged[clientId] || 0, vc2[clientId]);
  //   }
  //   this.logger.log("Merged vector clock:", JSON.stringify(merged, null, 2));
  //   return merged;
  // }

  public mergeVectorClocks(vc1: VectorClock, vc2: VectorClock): VectorClock {
    const merged: VectorClock = {};
    this.logger.log("Merging vector clocks:", JSON.stringify(vc1, null, 2), JSON.stringify(vc2, null, 2));
    const allClientIds = new Set([...Object.keys(vc1), ...Object.keys(vc2)]);
    for (const clientId of allClientIds) {
      merged[clientId] = Math.max(vc1[clientId] || 0, vc2[clientId] || 0);
    }
    this.logger.log("Merged vector clock:", JSON.stringify(merged, null, 2));
    return merged;
  }

  public deepFreeze<T>(obj: T): T {
    Object.keys(obj).forEach((key) => {
      const value = obj[key as keyof T];
      if (typeof value === 'object' && value !== null) {
        this.deepFreeze(value);
      }
    });
    return Object.freeze(obj);
  }

  public getServerVC(isInit: boolean = false): VectorClock {

    this.logger.log("getServerVC() isInit:", isInit);
    this.logger.log("Getting server vector clock:", this.serverVectorClock);

    const serverVC = this.serverVectorClock;
    if (!isInit && (!serverVC || Object.keys(serverVC).length === 0)) {
      this.logger.error('Server vector clock is not defined or empty');
      throw new Error('Server vector clock is not defined or empty');
    }
    this.logger.log('Server vector clock:', serverVC);
    return serverVC;
    // return this.deepFreeze({ ...serverVC });
  }

  public async setServerVectorClock(vc: { [clientId: string]: number }): Promise<void> {
    this.serverVectorClock = vc;
    this.logger.log('Server vector clock updated:', vc);
  }
  // public getServerVC(): Readonly<VectorClock> {
  //   this.logger.log("Getting server vector clock:", this.serverVectorClock);

  //   const serverVC = this.serverVectorClock;
  //   if (!serverVC || Object.keys(serverVC).length === 0) {
  //     this.logger.error('Server vector clock is not defined or empty');
  //     throw new Error('Server vector clock is not defined or empty');
  //   }
  //   return serverVC;
  //   // return Object.freeze({ ...this.serverVectorClock });
  // }

  // Function to compare vector clocks
  public compareVectorClocks(oldVc: VectorClock, newVc: VectorClock): number {
    this.logger.log("Comparing vector clocks:", oldVc, newVc);
    let isLess = false;
    let isGreater = false;

    const allClientIds = new Set([...Object.keys(oldVc), ...Object.keys(newVc)]);
    this.logger.log("All client IDs:", allClientIds);

    for (const clientId of allClientIds) {
      const oldValue = oldVc[clientId] || 0;
      const newValue = newVc[clientId] || 0;
      this.logger.log(`Client ID: ${clientId}, oldValue: ${oldValue}, newValue: ${newValue}`);

      if (oldValue < newValue) {
        isLess = true;
      } else if (oldValue > newValue) {
        isGreater = true;
      }

      if (isLess && isGreater) {
        this.logger.log("Vector clocks are concurrent");
        return 0; // Concurrent
      }
    }

    if (isLess && !isGreater) {
      this.logger.log("Old vector clock is less than new vector clock");
      return -1; // oldVc is less than newVc
    } else if (!isLess && isGreater) {
      this.logger.log("Old vector clock is greater than new vector clock");
      return 1; // oldVc is greater than newVc
    } else {
      this.logger.log("Vector clocks are equal or concurrent");
      return 0; // Equal or concurrent
    }
  }



  // Function to apply an operation to a document
  _applyOperation(doc: string, op: Operation): string {
    this.logger.log("Applying operation:", op, "to document:", doc);
    let newDoc: string;

    switch (op.type) {
      case 'insert':
        newDoc = doc.slice(0, op.position) + (op.text || '') + doc.slice(op.position);
        this.logger.log("Insert operation result:", newDoc);
        break;
      case 'delete':
        newDoc = doc.slice(0, op.position) + doc.slice(op.position + (op.length || 0));
        this.logger.log("Delete operation result:", newDoc);
        break;
      default:
        throw new Error('Unsupported operation');
    }

    this.logger.log("New document after operation:", newDoc);
    return newDoc;
  }

  public applyOperation(op: Operation): void {
    op.updatedAt = op.updatedAt || new Date().toISOString();
    this.logger.log("Applying operation:", JSON.stringify(op, null, 2));
    const oldDoc = this.doc;

    try {
      if (op.type === 'insert' && (op.position < 0 || op.position > this.doc.length)) {
        throw new Error(`Insert position ${op.position} is out of bounds (document length: ${this.doc.length})`);
      }
      if (op.type === 'delete' && (op.position < 0 || op.position >= this.doc.length)) {
        throw new Error(`Delete position ${op.position} is out of bounds (document length: ${this.doc.length})`);
      }
      if (op.type === 'delete' && (op.length || 0) > (this.doc.length - op.position)) {
        throw new Error(`Delete length ${op.length} exceeds remaining document length (${this.doc.length - op.position})`);
      }

      const transformedOp = this.transformOperation(op);
      this.logger.log("Transformed operation:", JSON.stringify(transformedOp, null, 2));


      this.doc = this._applyOperation(this.doc, transformedOp);
      this.logger.log("Document after applying operation:", this.doc);

      this.operations.push(transformedOp);
      this.logger.log("Operations list after applying operation:", JSON.stringify(this.operations, null, 2));

      this.serverVectorClock = this.mergeVectorClocks(this.serverVectorClock, transformedOp.vectorClock);
      this.logger.log("Server vector clock after applying operation:", JSON.stringify(this.serverVectorClock, null, 2));
    } catch (error) {
      this.logger.error("Error applying operation:", error);
      // Rollback the change
      this.doc = oldDoc;
      throw error;
    }
  }

  public getDocument(): string {
    this.logger.log("Getting document:", this.doc);
    return this.doc;
  }

  // Function to resolve conflicts between two concurrent operations
  // Returns true if existingOp should be prioritized over newOp, false otherwise
  private resolveConflict(existingOp: Operation, newOp: Operation): boolean {
    this.logger.log("Resolving conflict between operations:", existingOp, newOp);

    let existingOpUpdated = new Date(existingOp.updatedAt);
    let newOpUpdated = new Date(newOp.updatedAt);
    this.logger.log("Existing operation updated at:", existingOpUpdated);
    this.logger.log("New operation updated at:", newOpUpdated);

    if (existingOpUpdated.getTime() !== newOpUpdated.getTime()) {
      return existingOpUpdated < newOpUpdated;
    }

    if (existingOpUpdated !== newOpUpdated) {
      return existingOpUpdated < newOpUpdated;
    }

    // If everything is equal, prefer the existing operation
    return true;
  }

  private transformOperation(op: Operation): Operation {
    this.logger.log("Transforming operation:", op);
    let transformedOp = { ...op };

    for (const existingOp of this.operations) {
      const comparisonResult = this.compareVectorClocks(existingOp.vectorClock, op.vectorClock);
      this.logger.log("Comparison result:", comparisonResult);

      if (comparisonResult < 0) {
        transformedOp = this.transformAgainst(transformedOp, existingOp);
        let updatedVC = this.mergeVectorClocks(existingOp.vectorClock, transformedOp.vectorClock);
        transformedOp.vectorClock = updatedVC;
        this.logger.log("Transformed operation after merge:", transformedOp);
      } else if (comparisonResult === 0) {
        if (this.resolveConflict(existingOp, op)) {
          transformedOp = this.transformAgainst(transformedOp, existingOp);
          let updatedVC = this.mergeVectorClocks(existingOp.vectorClock, transformedOp.vectorClock);
          transformedOp.vectorClock = updatedVC;
          this.logger.log("Transformed operation after conflict resolution:", transformedOp);
        }
      }
    }

    this.logger.log("Final transformed operation:", transformedOp);
    return transformedOp;
  }

  // Private function to transform one operation against another to resolve conflicts.
  private transformAgainst(op: Operation, oldOp: Operation): Operation {
    this.logger.log("Transforming operation against existing operation:", JSON.stringify(op, null, 2), JSON.stringify(oldOp, null, 2));

    if (op.type === 'insert' && oldOp.type === 'insert') {
      if (op.position === oldOp.position) {
        // If inserting at the same position, the operation with the lower clientId goes first
        if (op.clientId > oldOp.clientId) {
          return { ...op, position: op.position + (oldOp.text?.length || 0) };
        }
      } else if (op.position > oldOp.position) {
        return { ...op, position: op.position + (oldOp.text?.length || 0) };
      }
    } else if (op.type === 'delete' && oldOp.type === 'delete') {
      const opEnd = op.position + (op.length || 0);
      const oldOpEnd = oldOp.position + (oldOp.length || 0);

      if (op.position >= oldOp.position && op.position < oldOpEnd) {
        // Partial or complete overlap
        const overlapStart = Math.max(op.position, oldOp.position);
        const overlapEnd = Math.min(opEnd, oldOpEnd);
        const overlapLength = overlapEnd - overlapStart;
        return {
          ...op,
          position: oldOp.position,
          length: (op.length || 0) - overlapLength
        };
      } else if (op.position >= oldOpEnd) {
        // op is after oldOp
        return { ...op, position: op.position - (oldOp.length || 0) };
      }
    } else if (op.type === 'insert' && oldOp.type === 'delete') {
      if (op.position > oldOp.position) {
        return { ...op, position: Math.max(oldOp.position, op.position - (oldOp.length || 0)) };
      }
    } else if (op.type === 'delete' && oldOp.type === 'insert') {
      if (op.position >= oldOp.position) {
        return { ...op, position: op.position + (oldOp.text?.length || 0) };
      }
    }

    this.logger.log("No transformation needed:", JSON.stringify(op, null, 2));
    return op;
  }
}
