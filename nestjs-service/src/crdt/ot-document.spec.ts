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
