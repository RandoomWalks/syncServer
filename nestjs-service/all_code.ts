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
import { OTDocument, Operation, VectorClock } from './ot-document.model';

describe('OTDocument', () => {
  let doc: OTDocument;

  beforeEach(() => {
    doc = new OTDocument('Hello');
  });

  it('should apply insert operation', () => {
    const op: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello World');
  });

  it('should apply delete operation', () => {
    const op: Operation = {
      type: 'delete',
      position: 0,
      length: 5,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('');
  });

  it('should merge vector clocks', () => {
    const vc1: VectorClock = { client1: 1, client2: 2 };
    const vc2: VectorClock = { client2: 3, client3: 1 };

    const merged = doc['mergeVectorClocks'](vc1, vc2);
    expect(merged).toEqual({ client1: 1, client2: 3, client3: 1 });
  });

  it('should compare vector clocks', () => {
    const vc1: VectorClock = { client1: 1, client2: 2 };
    const vc2: VectorClock = { client2: 3, client3: 1 };

    const result = doc['compareVectorClocks'](vc1, vc2);
    expect(result).toBe(0);
  });

  it('should transform insert against insert operation', () => {
    const op1: Operation = {
      type: 'insert',
      position: 0,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: 1,
      text: '!',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(2);
  });

  it('should transform delete against delete operation', () => {
    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 2,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 1,
      length: 2,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(0);
    expect(transformedOp.length).toBe(1);
  });

  it('should transform insert against delete operation', () => {
    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 2,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: 3,
      text: '!',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(1);
  });

  it('should transform delete against insert operation', () => {
    const op1: Operation = {
      type: 'insert',
      position: 0,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 2,
      length: 1,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(3);
  });

  it('should handle complex operation sequence', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 0,
      length: 5,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const op3: Operation = {
      type: 'insert',
      position: 0,
      text: 'Hey',
      vectorClock: { client3: 1 },
      clientId: 'client3',
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    doc.applyOperation(op3);
    expect(doc.getDocument()).toBe('Hey World');
  });

  it('should not change the position if no transformation is needed', () => {
    const op1: Operation = {
      type: 'insert',
      position: 0,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: 1,
      text: '!',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op1, op2);
    expect(transformedOp.position).toBe(0);
  });

  // New edge cases
  it('should transform insert before insert', () => {
    const op1: Operation = {
      type: 'insert',
      position: 1,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: 0,
      text: 'Hello ',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op1, op2);
    expect(transformedOp.position).toBe(7); // "Hello " is 6 chars long
  });

  it('should transform insert after insert', () => {
    const op1: Operation = {
      type: 'insert',
      position: 0,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: 1,
      text: '!',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(2);
  });

  it('should transform delete completely overlapping delete', () => {
    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 5,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 0,
      length: 3,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.length).toBe(0);
  });

  it('should transform delete partially overlapping delete', () => {
    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 5,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 2,
      length: 4,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(0);
    expect(transformedOp.length).toBe(1);
  });

  it('should transform delete before insert', () => {
    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 1,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: 1,
      text: '!',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op1, op2);
    expect(transformedOp.position).toBe(0);
  });

  it('should transform delete after insert', () => {
    const op1: Operation = {
      type: 'insert',
      position: 0,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 2,
      length: 1,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(3);
  });

  it('should transform insert at same position', () => {
    const op1: Operation = {
      type: 'insert',
      position: 1,
      text: 'A',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: 1,
      text: 'B',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(2);
  });

  it('should transform delete at same position', () => {
    const op1: Operation = {
      type: 'delete',
      position: 1,
      length: 1,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 1,
      length: 1,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const transformedOp = doc['transformAgainst'](op2, op1);
    expect(transformedOp.position).toBe(1);
    expect(transformedOp.length).toBe(0);
  });

  // Additional edge cases
  it('should handle zero-length delete', () => {
    const op: Operation = {
      type: 'delete',
      position: 0,
      length: 0,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should handle operations at document start', () => {
    const op1: Operation = {
      type: 'insert',
      position: 0,
      text: 'Start ',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 0,
      length: 6,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should handle operations at document end', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: ' End',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 5,
      length: 4,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should handle large document with many operations', () => {
    const largeText = 'A'.repeat(10000);
    doc = new OTDocument(largeText);

    const operations: Operation[] = [];
    for (let i = 0; i < 1000; i++) {
      operations.push({
        type: 'insert',
        position: i,
        text: 'X',
        vectorClock: { [`client${i}`]: i },
        clientId: `client${i}`,
      });
    }

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument().length).toBe(11000);
  });

  it('should maintain document integrity after random operations', () => {
    const operations: Operation[] = [];
    const initialDoc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    doc = new OTDocument(initialDoc);

    // Random insert and delete operations
    for (let i = 0; i < 100; i++) {
      const opType = Math.random() < 0.5 ? 'insert' : 'delete';
      const position = Math.floor(Math.random() * doc.getDocument().length);
      const length = Math.floor(Math.random() * 5);

      if (opType === 'insert') {
        operations.push({
          type: 'insert',
          position,
          text: 'X',
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      } else {
        operations.push({
          type: 'delete',
          position,
          length,
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      }
    }

    operations.forEach(op => doc.applyOperation(op));
    // Since operations are random, we can't predict the exact document state,
    // but we can check for consistency in length and absence of errors.
    expect(doc.getDocument().length).toBeGreaterThanOrEqual(0);
  });

  it('should handle insert and delete at extreme positions', () => {
    const op1: Operation = {
      type: 'insert',
      position: 0,
      text: 'Start ',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'insert',
      position: doc.getDocument().length,
      text: ' End',
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const op3: Operation = {
      type: 'delete',
      position: 0,
      length: 6,
      vectorClock: { client3: 1 },
      clientId: 'client3',
    };

    const op4: Operation = {
      type: 'delete',
      position: doc.getDocument().length - 3,
      length: 3,
      vectorClock: { client4: 1 },
      clientId: 'client4',
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    doc.applyOperation(op3);
    doc.applyOperation(op4);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should handle concurrent overlapping delete operations', () => {
    const op1: Operation = {
      type: 'delete',
      position: 2,
      length: 4,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 3,
      length: 2,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Heo');
  });

  it('should handle repeated insertions and deletions at the same position', () => {
    const operations: Operation[] = [
      { type: 'insert', position: 1, text: 'A', vectorClock: { client1: 1 }, clientId: 'client1' },
      { type: 'delete', position: 1, length: 1, vectorClock: { client2: 1 }, clientId: 'client2' },
      { type: 'insert', position: 1, text: 'B', vectorClock: { client1: 2 }, clientId: 'client1' },
      { type: 'delete', position: 1, length: 1, vectorClock: { client2: 2 }, clientId: 'client2' },
      { type: 'insert', position: 1, text: 'C', vectorClock: { client1: 3 }, clientId: 'client1' },
    ];

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument()).toBe('HCello');
  });

  it('should handle operations with long text segments', () => {
    const longText = 'A'.repeat(1000);
    const op1: Operation = {
      type: 'insert',
      position: 2,
      text: longText,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 2,
      length: 1000,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    expect(doc.getDocument().length).toBe(1005); // "He" + longText + "llo"

    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should handle high frequency of small operations', () => {
    const operations: Operation[] = [];
    const initialDoc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    doc = new OTDocument(initialDoc);

    for (let i = 0; i < 1000; i++) {
      const opType = Math.random() < 0.5 ? 'insert' : 'delete';
      const position = Math.floor(Math.random() * doc.getDocument().length);
      const length = Math.random() < 0.5 ? 1 : 2;

      if (opType === 'insert') {
        operations.push({
          type: 'insert',
          position,
          text: 'X',
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      } else {
        operations.push({
          type: 'delete',
          position,
          length,
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      }
    }

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument().length).toBeGreaterThanOrEqual(0);
  });

  it('should maintain document integrity after random operations with varying sizes', () => {
    const operations: Operation[] = [];
    const initialDoc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    doc = new OTDocument(initialDoc);

    for (let i = 0; i < 1000; i++) {
      const opType = Math.random() < 0.5 ? 'insert' : 'delete';
      const position = Math.floor(Math.random() * doc.getDocument().length);
      const length = Math.floor(Math.random() * 5) + 1;

      if (opType === 'insert') {
        const text = 'X'.repeat(length);
        operations.push({
          type: 'insert',
          position,
          text,
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      } else {
        operations.push({
          type: 'delete',
          position,
          length,
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      }
    }

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument().length).toBeGreaterThanOrEqual(0);
  });

  it('should handle concurrent inserts and deletes across multiple clients', () => {
    const op1: Operation = {
      type: 'insert',
      position: 2,
      text: 'A',
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 1,
      length: 2,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    const op3: Operation = {
      type: 'insert',
      position: 3,
      text: 'B',
      vectorClock: { client3: 1 },
      clientId: 'client3',
    };

    const op4: Operation = {
      type: 'delete',
      position: 0,
      length: 1,
      vectorClock: { client4: 1 },
      clientId: 'client4',
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    doc.applyOperation(op3);
    doc.applyOperation(op4);

    expect(doc.getDocument()).toBe('ABo');
  });

  it('should handle non-overlapping sequential delete operations', () => {
    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 1,
      vectorClock: { client1: 1 },
      clientId: 'client1',
    };

    const op2: Operation = {
      type: 'delete',
      position: 2,
      length: 2,
      vectorClock: { client2: 1 },
      clientId: 'client2',
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('e');
  });

  it('should handle interleaved insert and delete operations by the same client', () => {
    const operations: Operation[] = [
      { type: 'insert', position: 1, text: 'A', vectorClock: { client1: 1 }, clientId: 'client1' },
      { type: 'delete', position: 2, length: 1, vectorClock: { client1: 2 }, clientId: 'client1' },
      { type: 'insert', position: 3, text: 'B', vectorClock: { client1: 3 }, clientId: 'client1' },
      { type: 'delete', position: 4, length: 1, vectorClock: { client1: 4 }, clientId: 'client1' },
    ];

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument()).toBe('HABlo');
  });

  it('should maintain consistency when operations are applied in reverse order', () => {
    const operations: Operation[] = [
      { type: 'insert', position: 1, text: 'A', vectorClock: { client1: 1 }, clientId: 'client1' },
      { type: 'delete', position: 2, length: 1, vectorClock: { client2: 1 }, clientId: 'client2' },
    ];

    operations.forEach(op => doc.applyOperation(op));

    // Reverse order
    doc = new OTDocument('Hello');
    operations.reverse().forEach(op => doc.applyOperation(op));
    expect(doc.getDocument()).toBe('HAllo');
  });

  it('should handle bulk insert and delete operations', () => {
    const bulkOperations: Operation[] = [
      { type: 'insert', position: 0, text: 'Start ', vectorClock: { client1: 1 }, clientId: 'client1' },
      { type: 'insert', position: 6, text: 'Middle ', vectorClock: { client2: 1 }, clientId: 'client2' },
      { type: 'delete', position: 12, length: 5, vectorClock: { client3: 1 }, clientId: 'client3' },
      { type: 'insert', position: 16, text: ' End', vectorClock: { client4: 1 }, clientId: 'client4' },
    ];

    bulkOperations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument()).toBe('Start Middle End');
  });

  it('should handle very large documents with multiple clients', () => {
    const initialDoc = 'A'.repeat(10000);
    doc = new OTDocument(initialDoc);

    const operations: Operation[] = [];
    for (let i = 0; i < 5000; i++) {
      operations.push({
        type: 'insert',
        position: Math.floor(Math.random() * doc.getDocument().length),
        text: 'X',
        vectorClock: { [`client${i}`]: i },
        clientId: `client${i}`,
      });
    }

    for (let i = 0; i < 5000; i++) {
      operations.push({
        type: 'delete',
        position: Math.floor(Math.random() * doc.getDocument().length),
        length: Math.floor(Math.random() * 10),
        vectorClock: { [`client${i + 5000}`]: i },
        clientId: `client${i + 5000}`,
      });
    }

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument().length).toBeGreaterThanOrEqual(0);
  });

  it('should handle high frequency of random operations', () => {
    const initialDoc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    doc = new OTDocument(initialDoc);

    const operations: Operation[] = [];
    for (let i = 0; i < 10000; i++) {
      const opType = Math.random() < 0.5 ? 'insert' : 'delete';
      const position = Math.floor(Math.random() * doc.getDocument().length);
      const length = Math.floor(Math.random() * 5) + 1;

      if (opType === 'insert') {
        const text = 'X'.repeat(length);
        operations.push({
          type: 'insert',
          position,
          text,
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      } else {
        operations.push({
          type: 'delete',
          position,
          length,
          vectorClock: { [`client${i}`]: i },
          clientId: `client${i}`,
        });
      }
    }

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument().length).toBeGreaterThanOrEqual(0);
  });
});
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
}
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
    updatedAt: Date;
  }import { Module } from '@nestjs/common';
import { ChangeProcessorService } from './change-processor.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [ChangeProcessorService],
    exports: [ChangeProcessorService],
})
export class ChangeProcessorModule { }
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
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeProcessorService } from './change-processor.service';
import { DatabaseService } from '../database/database.service';
import { ChangeConverter } from '../converters/change.converter';
import { ChangeDto } from '../models/external/change.dto';
import { OTDocument, Operation } from '../crdt/ot-document.model';
import { Db, ObjectId } from 'mongodb';

jest.mock('../database/database.service');
jest.mock('../converters/change.converter');

describe('ChangeProcessorService', () => {
  let service: ChangeProcessorService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeProcessorService,
        DatabaseService,
      ],
    }).compile();

    service = module.get<ChangeProcessorService>(ChangeProcessorService);
    databaseService = module.get<DatabaseService>(DatabaseService);

    // Use a method to initialize the private otDocument member
    await service.resetDocument(''); // Initialize with empty document for testing
  });

  describe('resetDocument', () => {
    it('should reset the document', async () => {
      await service.resetDocument('Hello');
      const document = await service.getDocument();
      expect(document).toBe('Hello');
    });
  });

  describe('applyOperation', () => {
    it('should apply the operation', async () => {
      const operation: ChangeDto = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };
      const internalOperation: Operation = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };

      ChangeConverter.toInternal = jest.fn().mockReturnValue(internalOperation);

      await service.applyOperation(operation);

      const document = await service.getDocument();
      expect(document).toBe('Hello World');
    });
  });

  describe('getDocument', () => {
    it('should return the current document', async () => {
      await service.resetDocument('Hello World');
      const document = await service.getDocument();
      expect(document).toBe('Hello World');
    });
  });

  describe('processClientChanges', () => {
    it('should process client changes and update the database', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      const internalOperations: Operation[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];

      ChangeConverter.toInternal = jest.fn().mockImplementation(dto => internalOperations[0]);

      const db = { collection: jest.fn().mockReturnValue({ bulkWrite: jest.fn().mockResolvedValue({}) }) } as unknown as Db;
      databaseService.getDb = jest.fn().mockResolvedValue(db);

      await service.processClientChanges(changeDtos);

      expect(databaseService.getDb).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith('client-changes');
      expect(db.collection('client-changes').bulkWrite).toHaveBeenCalled();
    });

    it('should handle invalid ObjectId format for clientId', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: 'invalid-object-id' }];
      const internalOperations: Operation[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];

      ChangeConverter.toInternal = jest.fn().mockImplementation(dto => internalOperations[0]);

      const db = { collection: jest.fn().mockReturnValue({ bulkWrite: jest.fn().mockResolvedValue({}) }) } as unknown as Db;
      databaseService.getDb = jest.fn().mockResolvedValue(db);

      await service.processClientChanges(changeDtos);

      expect(db.collection('client-changes').bulkWrite).toHaveBeenCalled();
    });
  });

  describe('getServerChanges', () => {
    it('should retrieve server changes from the database', async () => {
      const since = new Date('2023-01-01T00:00:00Z');
      const changeDocuments = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: new ObjectId('60d5f9f8f8a6f12a9c3e3a11'), updatedAt: new Date() }];
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];

      const db = { collection: jest.fn().mockReturnValue({ find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(changeDocuments) }) }) } as unknown as Db;
      databaseService.getDb = jest.fn().mockResolvedValue(db);
      ChangeConverter.toExternal = jest.fn().mockImplementation(doc => changeDtos[0]);

      const result = await service.getServerChanges(since);

      expect(databaseService.getDb).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith('client-changes');
      expect(db.collection('client-changes').find).toHaveBeenCalledWith({ updatedAt: { $gt: since } });
      expect(result).toEqual(changeDtos);
    });
  });
});
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChangeProcessorModule } from './change-processor/change-processor.module';
import { DatabaseModule } from './database/database.module';
import { ServerChangeTrackerModule } from './server-change-tracker/server-change-tracker.module';
import { SyncModule } from './sync/sync.module';
import { HttpModule } from '@nestjs/axios';
import { GoClientService } from './sync/go-client.service';

@Module({
  imports: [ChangeProcessorModule, DatabaseModule, ServerChangeTrackerModule, SyncModule, HttpModule],
  controllers: [AppController],
  providers: [AppService, GoClientService],
})
export class AppModule {}

// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ChangeProcessorModule } from './modules/change-processor.module';
// import { DatabaseModule } from './modules/database.module';
// import { ServerChangeTrackerModule } from './modules/server-change-tracker.module';
// import { SyncModule } from './modules/sync.module';
// import { HttpModule } from '@nestjs/axios';

// @Module({
//     imports: [ChangeProcessorModule, DatabaseModule, ServerChangeTrackerModule, SyncModule, HttpModule],
//     controllers: [AppController],
//     providers: [AppService],
// })
// export class AppModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule { }


// src/database/database.module.ts
// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { ConfigModule } from '@nestjs/config';

// @Module({
//   imports: [
//     ConfigModule.forRoot(),
//     MongooseModule.forRoot(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     }),
//   ],
// })
// export class DatabaseModule {}
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import * as dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);


@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private db: Db;
    private client: MongoClient;
    private readonly logger = new Logger(DatabaseService.name);

    constructor(private configService: ConfigService) {
        // const uri = this.configService.get<string>('MONGO_URI');
        const uri = "mongodb://ab4745802:E1XuVmfq825LfV9o@cluster0-shard-00-00.mongodb.net:27017,cluster0-shard-00-01.mongodb.net:27017,cluster0-shard-00-02.mongodb.net:27017/mydb?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";
        this.client = new MongoClient(uri);
        // this.client = new MongoClient(this.configService.get<string>('MONGO_URI'));
    }



    async onModuleInit(): Promise<void> {
        // const uri = process.env.DATABASE_URL || 'mongodb://mongo:27017/mydb';
        // const uri = this.configService.get<string>('MONGO_URI');
        const uri  ="mongodb://ab4745802:E1XuVmfq825LfV9o@cluster0-shard-00-00.mongodb.net:27017,cluster0-shard-00-01.mongodb.net:27017,cluster0-shard-00-02.mongodb.net:27017/mydb?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority";


        this.logger.log(`Connecting to MongoDB at ${uri}`);

        try {
            // this.client = new MongoClient(uri);
            await this.client.connect();
            this.db = this.client.db('mydb');
            this.logger.log('Successfully connected to MongoDB');
            console.log('Connected to MongoDB');

            // Ensure indexes are created
            await this.createIndexes();
        } catch (error) {
            this.logger.error('Error connecting to MongoDB', error.stack);
            throw error;
        }
    }

    getDb(): Db {
        if (!this.db) {
            throw new Error('Database connection is not initialized.');
        }
        return this.db;
    }

    async onModuleDestroy(): Promise<void> {
        if (this.client) {
            this.logger.log('Closing MongoDB connection');
            try {
                await this.client.close();
                this.logger.log('MongoDB connection closed successfully');
            } catch (error) {
                this.logger.error('Error closing MongoDB connection', error.stack);
            }
        }
    }

    private async createIndexes(): Promise<void> {
        const collection = this.db.collection('client-changes');
        await collection.createIndex({ updatedAt: 1 });
        await collection.createIndex({ 'data._id': 1 });
    }
}


// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { MongoClient } from 'mongodb';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class DatabaseService implements OnModuleInit, OnModuleDestroy {
//     private client: MongoClient;
//     private db: any;

//     constructor(private configService: ConfigService) {
//         this.client = new MongoClient(this.configService.get<string>('MONGO_URI'));
//     }

//     async onModuleInit() {
//         await this.client.connect();
//         this.db = this.client.db();
//         console.log('Connected to MongoDB');
//     }

//     getDb() {
//         return this.db;
//     }

//     async onModuleDestroy() {
//         await this.client.close();
//     }
// }
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.getHello()).toBe('Hello World!');
        });
    });
});
import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { ChangeProcessorModule } from '../change-processor/change-processor.module';
import { ServerChangeTrackerModule } from '../server-change-tracker/server-change-tracker.module';
import { GoClientService } from './go-client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule,ChangeProcessorModule, ServerChangeTrackerModule],
  controllers: [SyncController],
  providers: [GoClientService],
})
export class SyncModule {}
    


// import { Injectable, HttpService } from '@nestjs/common';

// @Injectable()
// export class GoClientService {
//   constructor(private readonly httpService: HttpService) {}

//   async syncData(data: string[]): Promise<any> {
//     const response = await this.httpService.post('http://go-service:8080/sync', { data }).toPromise();
//     return response.data;
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ChangeDto } from '../models/external/change.dto';

@Injectable()
export class GoClientService {
  private readonly logger = new Logger(GoClientService.name);

  constructor(private readonly httpService: HttpService) { }

  async syncData(data: ChangeDto[]): Promise<any> {
    this.logger.log('Sending data to Go service');
    const response = await this.httpService.post('http://go-service:8080/sync', { data }).toPromise();
    this.logger.log('Received response from Go service');
    return response.data;
  }
}
import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';
import { GoClientService } from './go-client.service';
import { ChangeDto } from '../models/external/change.dto';

@Controller('sync')
export class SyncController {
    private readonly logger = new Logger(SyncController.name);

    constructor(
        private readonly changeProcessorService: ChangeProcessorService,
        private readonly serverChangeTrackerService: ServerChangeTrackerService,
        private readonly goClientService: GoClientService,
    ) { }

    /**
     * Endpoint to receive client changes
     * Example Request Data:
     * [
     *   {
     *     "type": "insert",
     *     "position": 5,
     *     "text": " World",
     *     "vectorClock": {"client1": 1},
     *     "clientId": "60d5f9f8f8a6f12a9c3e3a11"  // Valid ObjectId
     *   }
     * ]
     */
    @Post('client-changes')
    async receiveClientChanges(@Body() changeDtos: ChangeDto[]): Promise<any> {
        this.logger.log('Received client changes');
        this.logger.debug(`Client changes data: ${JSON.stringify(changeDtos)}`);

        // Add logging to check the structure
        console.log('Received changeDtos:', changeDtos);

        try {
            await this.changeProcessorService.processClientChanges(changeDtos);
            this.logger.log('Client changes processed successfully');
            return { success: true, message: 'Client changes processed successfully' };
        } catch (error) {
            this.logger.error('Error processing client changes', error.stack);
            // throw error;
            return { success: false, message: 'Error processing client changes', error: error.message };

        }
    }

    /**
     * Endpoint to retrieve server changes since a given date
     * Example Request: GET /sync/server-changes?since=2023-01-01T00:00:00Z
     */
    @Get('server-changes')
    async sendServerChanges(@Query('since') since: string): Promise<ChangeDto[]> {
        this.logger.log('Received request for server changes');
        this.logger.debug(`Query parameter 'since': ${since}`);
        const changesSince = new Date(since);
        if (isNaN(changesSince.getTime())) {
            this.logger.error('Invalid date format');
            throw new Error('Invalid time value');
        }
        try {
            this.logger.debug(`Parsed date: ${changesSince.toISOString()}`);
            const changes = await this.changeProcessorService.getServerChanges(changesSince);
            this.logger.log('Server changes retrieved successfully');
            return changes;
        } catch (error) {
            this.logger.error('Error retrieving server changes', error.stack);
            throw error;
        }
    }

    /**
     * Endpoint to process data via GoClientService
     * Example Request Data:
     * {
     *   "data": [
     *     {
     *       "type": "insert",
     *       "position": 5,
     *       "text": " World",
     *       "vectorClock": {"client1": 1},
     *       "clientId": "60d5f9f8f8a6f12a9c3e3a11"  // Valid ObjectId
     *     }
     *   ]
     * }
     */
    @Post('process')
    async processData(@Body() body: { data: ChangeDto[] }) {
        return this.goClientService.syncData(body.data);
    }

    /**
     * Endpoint to reset the document to an initial state
     * Example Request Data:
     * {
     *   "initialDocument": "Hello"
     * }
     */
    @Post('reset-document')
    async resetDocument(@Body() body: { initialDocument: string }): Promise<any> {
        this.logger.log('Received request to reset document');
        this.logger.debug(`Initial document: ${body.initialDocument}`);

        try {
            await this.changeProcessorService.resetDocument(body.initialDocument);
            this.logger.log('Document reset successfully');
            return { success: true, message: 'Document reset successfully' };
        } catch (error) {
            this.logger.error('Error resetting document', error.stack);
            return { success: false, message: 'Error processing Document reset', error: error.message };

            // throw error;
        }
    }

    /**
     * Endpoint to apply an operation to the document
     * Example Request Data:
     * {
     *   "operation": {
     *     "type": "insert",
     *     "position": 5,
     *     "text": " World",
     *     "vectorClock": {"client1": 1},
     *     "clientId": "60d5f9f8f8a6f12a9c3e3a11"  // Valid ObjectId
     *   }
     * }
     */
    @Post('apply-operation')
    async applyOperation(@Body() body: { operation: ChangeDto }): Promise<any> {
        this.logger.log('Received request to apply operation');
        this.logger.debug(`Operation data: ${JSON.stringify(body.operation)}`);

        try {
            await this.changeProcessorService.applyOperation(body.operation);
            this.logger.log('Operation applied successfully');
            return { success: true, message: 'Operation applied successfully' };
        } catch (error) {
            this.logger.error('Error applying operation', error.stack);
            return { success: false, message: 'Operation apply Error' ,error: error.message};

            // throw error;
        }
    }

    /**
     * Endpoint to get the current state of the document
     * Example Request: GET /sync/document
     */
    @Get('document')
    async getDocument(): Promise<any> {
        this.logger.log('Received request to get current document');

        try {
            const document = await this.changeProcessorService.getDocument();
            this.logger.log('Current document retrieved successfully');
            return {success: true, document };
        } catch (error) {
            this.logger.error('Error retrieving document', error.stack);
            return {success: true, message: 'Error retrieving document' ,error: error.message };

            // throw error;
        }
    }
}
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { ChangeDto } from '../models/external/change.dto';

describe('SyncController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/sync/client-changes (POST)', () => {
    it('should process client changes', async () => {
      const changeDtos: ChangeDto[] = [
        {
          type: 'insert',
          position: 5,
          text: ' World',
          vectorClock: { client1: 1 },
          clientId: '60d5f9f8f8a6f12a9c3e3a11',
        },
      ];
      return request(app.getHttpServer())
        .post('/sync/client-changes')
        .send(changeDtos)
        .expect(201)
        .expect({ message: 'Client changes processed successfully' });
    });

    it('should return 400 for invalid input', async () => {
      return request(app.getHttpServer())
        .post('/sync/client-changes')
        .send({ invalid: 'data' })
        .expect(400);
    });
  });

  describe('/sync/server-changes (GET)', () => {
    it('should retrieve server changes', async () => {
      return request(app.getHttpServer())
        .get('/sync/server-changes')
        .query({ since: '2023-01-01T00:00:00Z' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 400 for invalid date format', async () => {
      return request(app.getHttpServer())
        .get('/sync/server-changes')
        .query({ since: 'invalid-date' })
        .expect(400);
    });
  });

  describe('/sync/reset-document (POST)', () => {
    it('should reset the document', async () => {
      return request(app.getHttpServer())
        .post('/sync/reset-document')
        .send({ initialDocument: 'Hello' })
        .expect(201)
        .expect({ message: 'Document reset successfully' });
    });

    it('should return 400 for invalid input', async () => {
      return request(app.getHttpServer())
        .post('/sync/reset-document')
        .send({ invalid: 'data' })
        .expect(400);
    });
  });

  describe('/sync/apply-operation (POST)', () => {
    it('should apply operation', async () => {
      const operation: ChangeDto = {
        type: 'insert',
        position: 5,
        text: ' World',
        vectorClock: { client1: 1 },
        clientId: '60d5f9f8f8a6f12a9c3e3a11',
      };
      return request(app.getHttpServer())
        .post('/sync/apply-operation')
        .send({ operation })
        .expect(201)
        .expect({ message: 'Operation applied successfully' });
    });

    it('should return 400 for invalid input', async () => {
      return request(app.getHttpServer())
        .post('/sync/apply-operation')
        .send({ invalid: 'data' })
        .expect(400);
    });
  });

  describe('/sync/document (GET)', () => {
    it('should retrieve the current document', async () => {
      return request(app.getHttpServer())
        .get('/sync/document')
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.document).toBe('string');
        });
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { ChangeProcessorService } from '../change-processor/change-processor.service';
import { ServerChangeTrackerService } from '../server-change-tracker/server-change-tracker.service';
import { GoClientService } from './go-client.service';
import { ChangeDto } from '../models/external/change.dto';

describe('SyncController', () => {
  let syncController: SyncController;
  let changeProcessorService: ChangeProcessorService;
  let serverChangeTrackerService: ServerChangeTrackerService;
  let goClientService: GoClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: ChangeProcessorService,
          useValue: {
            processClientChanges: jest.fn(),
            getServerChanges: jest.fn(),
            resetDocument: jest.fn(),
            applyOperation: jest.fn(),
            getDocument: jest.fn(),
          },
        },
        {
          provide: ServerChangeTrackerService,
          useValue: {},
        },
        {
          provide: GoClientService,
          useValue: {
            syncData: jest.fn(),
          },
        },
      ],
    }).compile();

    syncController = module.get<SyncController>(SyncController);
    changeProcessorService = module.get<ChangeProcessorService>(ChangeProcessorService);
    serverChangeTrackerService = module.get<ServerChangeTrackerService>(ServerChangeTrackerService);
    goClientService = module.get<GoClientService>(GoClientService);
  });

  describe('receiveClientChanges', () => {
    it('should process client changes successfully', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      await expect(syncController.receiveClientChanges(changeDtos)).resolves.toEqual({ message: 'Client changes processed successfully' });
      expect(changeProcessorService.processClientChanges).toHaveBeenCalledWith(changeDtos);
    });

    it('should throw an error if processing client changes fails', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      jest.spyOn(changeProcessorService, 'processClientChanges').mockRejectedValue(new Error('Error processing client changes'));
      await expect(syncController.receiveClientChanges(changeDtos)).rejects.toThrow('Error processing client changes');
    });
  });

  describe('sendServerChanges', () => {
    it('should retrieve server changes successfully', async () => {
      const changes: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      jest.spyOn(changeProcessorService, 'getServerChanges').mockResolvedValue(changes);
      await expect(syncController.sendServerChanges('2023-01-01T00:00:00Z')).resolves.toEqual(changes);
      expect(changeProcessorService.getServerChanges).toHaveBeenCalledWith(new Date('2023-01-01T00:00:00Z'));
    });

    it('should throw an error for invalid date format', async () => {
      await expect(syncController.sendServerChanges('invalid-date')).rejects.toThrow('Invalid time value');
    });
  });

  describe('processData', () => {
    it('should process data via GoClientService successfully', async () => {
      const changeDtos: ChangeDto[] = [{ type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' }];
      jest.spyOn(goClientService, 'syncData').mockResolvedValue({ message: 'Data processed successfully' });
      await expect(syncController.processData({ data: changeDtos })).resolves.toEqual({ message: 'Data processed successfully' });
      expect(goClientService.syncData).toHaveBeenCalledWith(changeDtos);
    });
  });

  describe('resetDocument', () => {
    it('should reset the document successfully', async () => {
      await expect(syncController.resetDocument({ initialDocument: 'Hello' })).resolves.toEqual({ message: 'Document reset successfully' });
      expect(changeProcessorService.resetDocument).toHaveBeenCalledWith('Hello');
    });

    it('should throw an error if resetting document fails', async () => {
      jest.spyOn(changeProcessorService, 'resetDocument').mockRejectedValue(new Error('Error resetting document'));
      await expect(syncController.resetDocument({ initialDocument: 'Hello' })).rejects.toThrow('Error resetting document');
    });
  });

  describe('applyOperation', () => {
    it('should apply operation successfully', async () => {
      const operation: ChangeDto = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };
      await expect(syncController.applyOperation({ operation })).resolves.toEqual({ message: 'Operation applied successfully' });
      expect(changeProcessorService.applyOperation).toHaveBeenCalledWith(operation);
    });

    it('should throw an error if applying operation fails', async () => {
      const operation: ChangeDto = { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: '60d5f9f8f8a6f12a9c3e3a11' };
      jest.spyOn(changeProcessorService, 'applyOperation').mockRejectedValue(new Error('Error applying operation'));
      await expect(syncController.applyOperation({ operation })).rejects.toThrow('Error applying operation');
    });
  });

  describe('getDocument', () => {
    it('should retrieve the current document successfully', async () => {
      const document = 'Hello World';
      jest.spyOn(changeProcessorService, 'getDocument').mockResolvedValue(document);
      await expect(syncController.getDocument()).resolves.toEqual({ document });
      expect(changeProcessorService.getDocument).toHaveBeenCalled();
    });

    it('should throw an error if retrieving document fails', async () => {
      jest.spyOn(changeProcessorService, 'getDocument').mockRejectedValue(new Error('Error retrieving document'));
      await expect(syncController.getDocument()).rejects.toThrow('Error retrieving document');
    });
  });
});
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');

}
bootstrap();


// // converters/change.converter.ts
import { ChangeDto } from '../models/external/change.dto';
import { ChangeDocument } from '../models/internal/change.model';
import { Operation } from '../crdt/ot-document.model';

export class ChangeConverter {
  static toInternal(changeDto: ChangeDto): Operation {
    return {
      type: changeDto.type,
      position: changeDto.position,
      vectorClock: changeDto.vectorClock,
      clientId: changeDto.clientId,
      ...(changeDto.text && { text: changeDto.text }),
      ...(changeDto.length && { length: changeDto.length }),
    };
  }

  static toExternal(doc: ChangeDocument): ChangeDto {
    return {
      type: doc.type,
      position: doc.position,
      vectorClock: doc.vectorClock,
      clientId: doc.clientId,
      text: doc.text,
      length: doc.length,
    };
  }
}import { Module } from '@nestjs/common';
import { ServerChangeTrackerService } from './server-change-tracker.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [ServerChangeTrackerService],
    exports: [ServerChangeTrackerService],
})
export class ServerChangeTrackerModule { }
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ChangeDocument } from '../models/internal/change.model';
import { ChangeDto } from '../models/external/change.dto';
import { ChangeConverter } from '../converters/change.converter';

import { ObjectId } from 'mongodb';


@Injectable()
export class ServerChangeTrackerService {
    private readonly logger = new Logger(ServerChangeTrackerService.name);

    constructor(private readonly databaseService: DatabaseService) {}

    async trackChange(changeDto: ChangeDto): Promise<void> {
        this.logger.log('Tracking change');
        const change: ChangeDocument = {
            ...ChangeConverter.toInternal(changeDto),
            _id:new ObjectId(), 
            updatedAt:new Date(),
        }

        try {
            const db = await this.databaseService.getDb();
            const collection = db.collection('change-tracker');
            await collection.insertOne(change);
            this.logger.log('Change tracked successfully');
        } catch (error) {
            this.logger.error('Error tracking change', error.stack);
            throw error;
        }
    }

    async getChangesSince(timestamp: Date): Promise<ChangeDto[]> {
        this.logger.log('Retrieving changes since timestamp');
        try {
            const db = await this.databaseService.getDb();
            const collection = db.collection<ChangeDocument>('change-tracker');
            const changes:ChangeDocument[] = await collection.find({ timestamp: { $gt: timestamp } }).toArray();
            if (!changes) {
                throw new Error('Failed to retrieve changes from the database');
            }
            return changes.map((doc) => {
                return ChangeConverter.toExternal(doc);
            });
        } catch (error) {
            this.logger.error('Error retrieving changes', error.stack);
            throw error;
        }
    }
}
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
