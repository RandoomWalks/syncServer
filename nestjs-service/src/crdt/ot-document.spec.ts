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
    expect(transformedOp.length).toBe(1);
  });
});
