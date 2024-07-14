// import { VectorClock, Operation } from './ot.model';

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

  constructor(initialDoc: string) {
    this.doc = initialDoc;
    this.operations = [];
    this.serverVectorClock = {} as VectorClock; // [clientId: string]: number;
    console.log("Initialized OTDocument with doc:", initialDoc);
  }

  // Function to merge vector clocks
  public mergeVectorClocks(vc1: VectorClock, vc2: VectorClock): VectorClock {
    console.log("Merging vector clocks:", vc1, vc2);
    const merged: VectorClock = { ...vc1 };
    for (const clientId in vc2) {
      merged[clientId] = Math.max(merged[clientId] || 0, vc2[clientId]);
    }
    console.log("Merged vector clock:", merged);
    return merged;
  }

  public getServerVC(): Readonly<VectorClock> {
    console.log("Getting server vector clock:", this.serverVectorClock);
    return Object.freeze({ ...this.serverVectorClock });
  }

  // Function to compare vector clocks
  public compareVectorClocks(oldVc: VectorClock, newVc: VectorClock): number {
    console.log("Comparing vector clocks:", oldVc, newVc);
    let isLess = false;
    let isGreater = false;

    const allClientIds = new Set([...Object.keys(oldVc), ...Object.keys(newVc)]);
    console.log("All client IDs:", allClientIds);

    for (const clientId of allClientIds) {
      const oldValue = oldVc[clientId] || 0;
      const newValue = newVc[clientId] || 0;
      console.log(`Client ID: ${clientId}, oldValue: ${oldValue}, newValue: ${newValue}`);

      if (oldValue < newValue) {
        isLess = true;
      } else if (oldValue > newValue) {
        isGreater = true;
      }

      if (isLess && isGreater) {
        console.log("Vector clocks are concurrent");
        return 0; // Concurrent
      }
    }

    if (isLess && !isGreater) {
      console.log("Old vector clock is less than new vector clock");
      return -1; // oldVc is less than newVc
    } else if (!isLess && isGreater) {
      console.log("Old vector clock is greater than new vector clock");
      return 1; // oldVc is greater than newVc
    } else {
      console.log("Vector clocks are equal or concurrent");
      return 0; // Equal or concurrent
    }
  }

  // Function to apply an operation to a document
  _applyOperation(doc: string, op: Operation): string {
    console.log("Applying operation:", op, "to document:", doc);
    let newDoc: string;

    switch (op.type) {
      case 'insert':
        newDoc = doc.slice(0, op.position) + (op.text || '') + doc.slice(op.position);
        console.log("Insert operation result:", newDoc);
        break;
      case 'delete':
        newDoc = doc.slice(0, op.position) + doc.slice(op.position + (op.length || 0));
        console.log("Delete operation result:", newDoc);
        break;
      default:
        throw new Error('Unsupported operation');
    }

    console.log("New document after operation:", newDoc);
    return newDoc;
  }

  public applyOperation(op: Operation): void {
    op.updatedAt = op.updatedAt || new Date().toISOString();
    console.log("Applying operation:", op);

    if (op.type === 'insert' && (op.position < 0 || op.position > this.doc.length)) {
      throw new Error('Insert position is out of bounds');
    }
    if (op.type === 'delete' && (op.position < 0 || op.position >= this.doc.length)) {
      throw new Error('Delete position is out of bounds');
    }
    if (op.type === 'delete' && (op.length || 0) > (this.doc.length - op.position)) {
      throw new Error('Delete length exceeds document length');
    }

    const transformedOp = this.transformOperation(op);
    console.log("Transformed operation:", transformedOp);
    this.doc = this._applyOperation(this.doc, transformedOp);
    console.log("Document after applying operation:", this.doc);
    this.operations.push(transformedOp);
    console.log("Operations list after applying operation:", this.operations);
    this.serverVectorClock = this.mergeVectorClocks(this.serverVectorClock, transformedOp.vectorClock);
    console.log("Server vector clock after applying operation:", this.serverVectorClock);
  }

  public getDocument(): string {
    console.log("Getting document:", this.doc);
    return this.doc;
  }

  // Function to resolve conflicts between two concurrent operations
  // Returns true if existingOp should be prioritized over newOp, false otherwise
  private resolveConflict(existingOp: Operation, newOp: Operation): boolean {
    console.log("Resolving conflict between operations:", existingOp, newOp);

    let existingOpUpdated = new Date(existingOp.updatedAt);
    let newOpUpdated = new Date(newOp.updatedAt);
    console.log("Existing operation updated at:", existingOpUpdated);
    console.log("New operation updated at:", newOpUpdated);

    if (existingOpUpdated !== newOpUpdated) {
      return existingOpUpdated < newOpUpdated;
    }

    return existingOp.clientId < newOp.clientId;
  }

  private transformOperation(op: Operation): Operation {
    console.log("Transforming operation:", op);
    let transformedOp = { ...op };

    for (const existingOp of this.operations) {
      const comparisonResult = this.compareVectorClocks(existingOp.vectorClock, op.vectorClock);
      console.log("Comparison result:", comparisonResult);

      if (comparisonResult < 0) {
        transformedOp = this.transformAgainst(transformedOp, existingOp);
        let updatedVC = this.mergeVectorClocks(existingOp.vectorClock, transformedOp.vectorClock);
        transformedOp.vectorClock = updatedVC;
        console.log("Transformed operation after merge:", transformedOp);
      } else if (comparisonResult === 0) {
        if (this.resolveConflict(existingOp, op)) {
          transformedOp = this.transformAgainst(transformedOp, existingOp);
          let updatedVC = this.mergeVectorClocks(existingOp.vectorClock, transformedOp.vectorClock);
          transformedOp.vectorClock = updatedVC;
          console.log("Transformed operation after conflict resolution:", transformedOp);
        }
      }
    }

    console.log("Final transformed operation:", transformedOp);
    return transformedOp;
  }

  // Private function to transform one operation against another to resolve conflicts.
  private transformAgainst(op: Operation, oldOp: Operation): Operation {
    console.log("Transforming operation against existing operation:", op, oldOp);

    if (op.type === 'insert' && oldOp.type === 'insert') {
      if (op.position > oldOp.position || (op.position === oldOp.position && op.clientId > oldOp.clientId)) {
        const transformed = { ...op, position: op.position + (oldOp.text?.length || 0) };
        console.log("Insert-insert conflict resolved to:", transformed);
        return transformed;
      }
    } else if (op.type === 'delete' && oldOp.type === 'delete') {
      if (op.position >= oldOp.position && op.position < oldOp.position + (oldOp.length || 0)) {
        const overlap = Math.min(op.length || 0, (oldOp.length || 0) - (op.position - oldOp.position));
        const transformed = { ...op, position: oldOp.position, length: (op.length || 0) - overlap };
        console.log("Delete-delete conflict resolved to:", transformed);
        return transformed;
      } else if (op.position >= oldOp.position + (oldOp.length || 0)) {
        const transformed = { ...op, position: op.position - (oldOp.length || 0) };
        console.log("Delete-delete non-overlapping conflict resolved to:", transformed);
        return transformed;
      } else if (op.position + (op.length || 0) <= oldOp.position) {
        console.log("Delete-delete non-conflicting operations, no transformation needed:", op);
        return op;
      }
    } else if (op.type === 'insert' && oldOp.type === 'delete') {
      if (op.position >= oldOp.position + (oldOp.length || 0)) {
        const transformed = { ...op, position: op.position - (oldOp.length || 0) };
        console.log("Insert-delete conflict resolved to:", transformed);
        return transformed;
      } else if (op.position >= oldOp.position && op.position < oldOp.position + (oldOp.length || 0)) {
        const transformed = { ...op, position: oldOp.position };
        console.log("Insert within delete range resolved to:", transformed);
        return transformed;
      }
    } else if (op.type === 'delete' && oldOp.type === 'insert') {
      if (op.position >= oldOp.position) {
        const transformed = { ...op, position: op.position + (oldOp.text?.length || 0) };
        console.log("Delete after insert conflict resolved to:", transformed);
        return transformed;
      }
    }

    console.log("No transformation needed:", op);
    return op;
  }
}
