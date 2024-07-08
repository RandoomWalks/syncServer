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
    updatedAt: string;
}


export class OTDocument {
    private doc: string;
    private operations: Operation[];

    constructor(initialDoc: string) {
        this.doc = initialDoc;
        this.operations = [];
    }

    // Function to merge vector clocks
    public mergeVectorClocks(vc1: VectorClock, vc2: VectorClock): VectorClock {
        const merged: VectorClock = { ...vc1 };
        for (const clientId in vc2) {
            merged[clientId] = Math.max(merged[clientId] || 0, vc2[clientId]);
        }
        return merged;
    }
    
    // Function to compare vector clocks
    public compareVectorClocks(vc1: VectorClock, vc2: VectorClock): number {
        let isLess = false;
        let isGreater = false;
        for (const clientId in vc1) {
            if ((vc2[clientId] || 0) < vc1[clientId]) {
                isGreater = true;
            } else if ((vc2[clientId] || 0) > vc1[clientId]) {
                isLess = true;
            }
        }
        for (const clientId in vc2) {
            if ((vc1[clientId] || 0) < vc2[clientId]) {
                isLess = true;
            } else if ((vc1[clientId] || 0) > vc2[clientId]) {
                isGreater = true;
            }
        }
        return isLess && isGreater ? 0 : isLess ? -1 : isGreater ? 1 : 0;
    }
    
    // Function to apply an operation to a document
     _applyOperation(doc: string, op: Operation): string {
        let newDoc: string;
    
        switch (op.type) {
            case 'insert':
                newDoc = doc.slice(0, op.position) + (op.text || '') + doc.slice(op.position);
                break;
            case 'delete':
                newDoc = doc.slice(0, op.position) + doc.slice(op.position + (op.length || 0));
                break;
            default:
                throw new Error('Unsupported operation');
        }
    
        return newDoc;
    }

    public applyOperation(op: Operation): void {
        const transformedOp = this.transformOperation(op);
        this.doc = this._applyOperation(this.doc, transformedOp);
        this.operations.push(transformedOp);
    }

    public getDocument(): string {
        return this.doc;
    }

    private transformOperation(op: Operation): Operation {
        let transformedOp = { ...op };

        for (const existingOp of this.operations) {
            if (this.compareVectorClocks(existingOp.vectorClock, op.vectorClock) < 0) {
                transformedOp = this.transformAgainst(transformedOp, existingOp);
            }
        }

        return transformedOp;
    }

    // private transformAgainst(op: Operation, againstOp: Operation): Operation {
    //     if (op.type === 'insert' && againstOp.type === 'insert') {
    //         if (op.position > againstOp.position || (op.position === againstOp.position && op.clientId > againstOp.clientId)) {
    //             return { ...op, position: op.position + (againstOp.text?.length || 0) };
    //         }
    //     } else if (op.type === 'delete' && againstOp.type === 'delete') {
    //         // if (op.position >= againstOp.position && op.position < againstOp.position + (againstOp.length || 0)) {
    //         //     return { ...op, position: againstOp.position, length: 0 };
    //         // } else if (op.position > againstOp.position + (againstOp.length || 0)) {
    //         //     return { ...op, position: op.position - (againstOp.length || 0) };
    //         // }
    //         if (op.position >= againstOp.position && op.position < againstOp.position + (againstOp.length || 0)) {
    //             const overlap = (againstOp.length || 0) - (op.position - againstOp.position);
    //             return { ...op, position: againstOp.position, length: (op.length || 0) - overlap };
    //         } else if (op.position > againstOp.position + (againstOp.length || 0)) {
    //             return { ...op, position: op.position - (againstOp.length || 0) };
    //         }
    
            
    //     } else if (op.type === 'insert' && againstOp.type === 'delete') {
    //         if (op.position >= againstOp.position + (againstOp.length || 0)) {
    //             return { ...op, position: op.position - (againstOp.length || 0) };
    //         }
    //     } else if (op.type === 'delete' && againstOp.type === 'insert') {
    //         if (op.position >= againstOp.position) {
    //             return { ...op, position: op.position + (againstOp.text?.length || 0) };
    //         }
    //     }

    //     return op;
    // }
    private transformAgainst(op: Operation, againstOp: Operation): Operation {
        if (op.type === 'insert' && againstOp.type === 'insert') {
          if (op.position > againstOp.position || (op.position === againstOp.position && op.clientId > againstOp.clientId)) {
            return { ...op, position: op.position + (againstOp.text?.length || 0) };
          }
        } else if (op.type === 'delete' && againstOp.type === 'delete') {
          if (op.position >= againstOp.position && op.position < againstOp.position + (againstOp.length || 0)) {
            const overlap = Math.min(op.length || 0, (againstOp.length || 0) - (op.position - againstOp.position));
            return { ...op, position: againstOp.position, length: (op.length || 0) - overlap };
          } else if (op.position >= againstOp.position + (againstOp.length || 0)) {
            return { ...op, position: op.position - (againstOp.length || 0) };
          } else if (op.position + (op.length || 0) <= againstOp.position) {
            // If op ends before againstOp starts, no change needed
            return op;
          }
        } else if (op.type === 'insert' && againstOp.type === 'delete') {
          if (op.position >= againstOp.position + (againstOp.length || 0)) {
            return { ...op, position: op.position - (againstOp.length || 0) };
          } else if (op.position >= againstOp.position && op.position < againstOp.position + (againstOp.length || 0)) {
            return { ...op, position: againstOp.position };
          }
        } else if (op.type === 'delete' && againstOp.type === 'insert') {
          if (op.position >= againstOp.position) {
            return { ...op, position: op.position + (againstOp.text?.length || 0) };
          }
        }
        return op;
      }
      
      
}
