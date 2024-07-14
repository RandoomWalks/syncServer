import { OTDocument, Operation,VectorClock} from './ot-document.model';

describe('OTDocument', () => {
  let doc: OTDocument;

  beforeEach(() => {
    doc = new OTDocument('Hello');
  });

  it('should apply insert operation at the end', () => {
    const op: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-1',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello World');
  });

  it('should apply insert operation at the beginning', () => {
    const op: Operation = {
      type: 'insert',
      position: 0,
      text: 'Start ',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Start Hello');
  });

  it('should apply insert operation in the middle', () => {
    const op: Operation = {
      type: 'insert',
      position: 3,
      text: '---',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-3',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hel---lo');
  });

  it('should apply delete operation at the start', () => {
    const op: Operation = {
      type: 'delete',
      position: 0,
      length: 1,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-4',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('ello');
  });

  it('should apply delete operation at the end', () => {
    const op: Operation = {
      type: 'delete',
      position: 4,
      length: 1,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-5',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hell');
  });

  it('should apply delete operation in the middle', () => {
    const op: Operation = {
      type: 'delete',
      position: 2,
      length: 2,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-6',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Heo');
  });

  it('should handle conflicting vector clocks', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'delete',
      position: 0,
      length: 5,
      vectorClock: { client1: 2 },
      clientId: 'client-uuid-1',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe(' World');
  });

  it('should handle empty insert operation', () => {
    const op: Operation = {
      type: 'insert',
      position: 2,
      text: '',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-7',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should handle empty delete operation', () => {
    const op: Operation = {
      type: 'delete',
      position: 2,
      length: 0,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-8',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should handle out-of-bounds insert position', () => {
    const op: Operation = {
      type: 'insert',
      position: 100,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-9',
      updatedAt: new Date().toISOString()
    };

    expect(() => doc.applyOperation(op)).toThrow('Insert position is out of bounds');
  });

  it('should handle out-of-bounds delete position', () => {
    const op: Operation = {
      type: 'delete',
      position: 100,
      length: 1,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-10',
      updatedAt: new Date().toISOString()
    };

    expect(() => doc.applyOperation(op)).toThrow('Delete position is out of bounds');
  });

  it('should handle delete operation with length exceeding document length', () => {
    const op: Operation = {
      type: 'delete',
      position: 0,
      length: 100,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-11',
      updatedAt: new Date().toISOString()
    };

    expect(() => doc.applyOperation(op)).toThrow('Delete length exceeds document length');
  });

  it('should handle missing updatedAt field', () => {
    const op: Operation = {
      type: 'insert',
      position: 5,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-12',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello!');
  });

  it('should handle large insert operation', () => {
    const largeText = 'A'.repeat(10000);
    const op: Operation = {
      type: 'insert',
      position: 5,
      text: largeText,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-13',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello' + largeText);
  });

  it('should handle large delete operation', () => {
    const largeText = 'A'.repeat(10000);
    const initialDoc = 'Hello' + largeText;
    doc = new OTDocument(initialDoc);

    const op: Operation = {
      type: 'delete',
      position: 5,
      length: 10000,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-14',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('Hello');
  });

  it('should apply multiple insert operations with overlapping positions', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'insert',
      position: 5,
      text: '!',
      vectorClock: { client1: 2 },
      clientId: 'client-uuid-2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello! World');
  });
  
  it('should handle delete operation that removes entire document content', () => {
    const op: Operation = {
      type: 'delete',
      position: 0,
      length: 5,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-15',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getDocument()).toBe('');
  });


  it('should handle high concurrency with multiple inserts and deletes', () => {
    const operations: Operation[] = [
      { type: 'insert', position: 5, text: '!', vectorClock: { client1: 1 }, clientId: 'client-uuid-16', updatedAt: new Date().toISOString() },
      { type: 'insert', position: 0, text: 'Start ', vectorClock: { client2: 1 }, clientId: 'client-uuid-17', updatedAt: new Date().toISOString() },
      { type: 'delete', position: 2, length: 2, vectorClock: { client3: 1 }, clientId: 'client-uuid-18', updatedAt: new Date().toISOString() },
      { type: 'insert', position: 3, text: '---', vectorClock: { client4: 1 }, clientId: 'client-uuid-19', updatedAt: new Date().toISOString() }
    ];

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument()).toBe('Start H---lo!');
  });

  it('should throw error for unsupported operation type', () => {
    const op: any = {
      type: 'unsupported',
      position: 0,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-20',
      updatedAt: new Date().toISOString()
    };

    expect(() => doc.applyOperation(op)).toThrow('Unsupported operation');
  });

  it('should handle concurrent large insert and delete operations', () => {
    const largeText1 = 'A'.repeat(5000);
    const largeText2 = 'B'.repeat(5000);

    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: largeText1,
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-21',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'delete',
      position: 0,
      length: 5,
      vectorClock: { client2: 1 },
      clientId: 'client-uuid-22',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe(largeText1);

    const op3: Operation = {
      type: 'insert',
      position: 0,
      text: largeText2,
      vectorClock: { client3: 1 },
      clientId: 'client-uuid-23',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op3);
    expect(doc.getDocument()).toBe(largeText2 + largeText1);
  });

  it('should handle operations with identical vector clocks by client ID', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-24',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-24',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello! World');
  });

  it('should handle conflicting operations from different clients', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client-uuid-25',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client2: 1 },
      clientId: 'client-uuid-26',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello! World');
  });

  
  
  it('should correctly merge vector clocks', () => {
    const vc1: VectorClock = { client1: 1, client2: 2 };
    const vc2: VectorClock = { client2: 3, client3: 1 };
    const merged = doc.mergeVectorClocks(vc1, vc2);
    expect(merged).toEqual({ client1: 1, client2: 3, client3: 1 });
  });

  it('should correctly compare vector clocks', () => {
    const vc1: VectorClock = { client1: 1, client2: 2 };
    const vc2: VectorClock = { client1: 1, client2: 3 };
    const vc3: VectorClock = { client1: 2, client2: 1 };

    expect(doc.compareVectorClocks(vc1, vc2)).toBe(-1);
    expect(doc.compareVectorClocks(vc2, vc1)).toBe(1);
    expect(doc.compareVectorClocks(vc1, vc3)).toBe(0); // Concurrent
    expect(doc.compareVectorClocks(vc1, vc1)).toBe(0); // Equal
  });

  it('should handle concurrent insert operations', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'insert',
      position: 5,
      text: ' Beautiful',
      vectorClock: { client2: 1 },
      clientId: 'client2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello World Beautiful');
  });

  it('should handle concurrent delete operations', () => {
    doc = new OTDocument('Hello World');

    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 6,
      vectorClock: { client1: 1 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'delete',
      position: 5,
      length: 6,
      vectorClock: { client2: 1 },
      clientId: 'client2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('World');
  });

  it('should handle insert-delete conflict', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: ' World',
      vectorClock: { client1: 1 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'delete',
      position: 3,
      length: 2,
      vectorClock: { client2: 1 },
      clientId: 'client2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hel World');
  });

  it('should maintain correct order of operations based on vector clocks', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: '1',
      vectorClock: { client1: 1 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'insert',
      position: 5,
      text: '2',
      vectorClock: { client1: 2 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    const op3: Operation = {
      type: 'insert',
      position: 5,
      text: '3',
      vectorClock: { client2: 1 },
      clientId: 'client2',
      updatedAt: new Date().toISOString()
    };

    // Apply operations in different order
    doc.applyOperation(op2);
    doc.applyOperation(op1);
    doc.applyOperation(op3);

    expect(doc.getDocument()).toBe('Hello321');
  });

  it('should handle operations with missing vector clock entries', () => {
    const op1: Operation = {
      type: 'insert',
      position: 5,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'insert',
      position: 6,
      text: '?',
      vectorClock: { client2: 1 },
      clientId: 'client2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('Hello!?');
  });

  it('should handle a long sequence of operations', () => {
    const operations: Operation[] = [
      { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: 'client1', updatedAt: new Date().toISOString() },
      { type: 'delete', position: 0, length: 5, vectorClock: { client2: 1 }, clientId: 'client2', updatedAt: new Date().toISOString() },
      { type: 'insert', position: 0, text: 'Hey', vectorClock: { client3: 1 }, clientId: 'client3', updatedAt: new Date().toISOString() },
      { type: 'insert', position: 3, text: ',', vectorClock: { client1: 2 }, clientId: 'client1', updatedAt: new Date().toISOString() },
      { type: 'delete', position: 4, length: 1, vectorClock: { client2: 2 }, clientId: 'client2', updatedAt: new Date().toISOString() }
    ];

    operations.forEach(op => doc.applyOperation(op));
    expect(doc.getDocument()).toBe('Hey,World');
  });

  it('should handle operations that completely overlap', () => {
    doc = new OTDocument('Hello World');

    const op1: Operation = {
      type: 'delete',
      position: 0,
      length: 11,
      vectorClock: { client1: 1 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    const op2: Operation = {
      type: 'delete',
      position: 0,
      length: 11,
      vectorClock: { client2: 1 },
      clientId: 'client2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op1);
    doc.applyOperation(op2);
    expect(doc.getDocument()).toBe('');
  });

  it('should correctly update server vector clock after each operation', () => {
    const op: Operation = {
      type: 'insert',
      position: 5,
      text: '!',
      vectorClock: { client1: 1 },
      clientId: 'client1',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op);
    expect(doc.getServerVC()).toEqual({ client1: 1 });

    const op2: Operation = {
      type: 'insert',
      position: 6,
      text: '?',
      vectorClock: { client2: 1 },
      clientId: 'client2',
      updatedAt: new Date().toISOString()
    };

    doc.applyOperation(op2);
    expect(doc.getServerVC()).toEqual({ client1: 1, client2: 1 });
  });
  // it('should handle multiple concurrent inserts at the same position', () => {
  //   const doc = new OTDocument('Hello');
  //   const op1 = { type: 'insert', position: 5, text: '1', vectorClock: { client1: 1 }, clientId: 'client1', updatedAt: new Date().toISOString() };
  //   const op2 = { type: 'insert', position: 5, text: '2', vectorClock: { client2: 1 }, clientId: 'client2', updatedAt: new Date().toISOString() };
  //   const op3 = { type: 'insert', position: 5, text: '3', vectorClock: { client3: 1 }, clientId: 'client3', updatedAt: new Date().toISOString() };

  //   doc.applyOperation(op1);
  //   doc.applyOperation(op2);
  //   doc.applyOperation(op3);

  //   expect(doc.getDocument()).toBe('Hello123');
  // });

  // it('should handle overlapping delete operations', () => {
  //   const doc = new OTDocument('ABCDEFGH');
  //   const op1 = { type: 'delete', position: 1, length: 4, vectorClock: { client1: 1 }, clientId: 'client1', updatedAt: new Date().toISOString() };
  //   const op2 = { type: 'delete', position: 3, length: 4, vectorClock: { client2: 1 }, clientId: 'client2', updatedAt: new Date().toISOString() };

  //   doc.applyOperation(op1);
  //   doc.applyOperation(op2);

  //   expect(doc.getDocument()).toBe('AH');
  // });

  // it('should handle complex scenario with mixed operations', () => {
  //   const doc = new OTDocument('Hello');
  //   const ops = [
  //     { type: 'insert', position: 5, text: ' World', vectorClock: { client1: 1 }, clientId: 'client1', updatedAt: new Date().toISOString() },
  //     { type: 'delete', position: 0, length: 5, vectorClock: { client2: 1 }, clientId: 'client2', updatedAt: new Date().toISOString() },
  //     { type: 'insert', position: 0, text: 'Hi', vectorClock: { client3: 1 }, clientId: 'client3', updatedAt: new Date().toISOString() },
  //     { type: 'delete', position: 3, length: 2, vectorClock: { client1: 2 }, clientId: 'client1', updatedAt: new Date().toISOString() },
  //   ];

  //   ops.forEach(op => doc.applyOperation(op));

  //   expect(doc.getDocument()).toBe('Hi Wld');
  // });
  
});