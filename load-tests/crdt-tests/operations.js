function applyOperation(doc, op) {
    if (op.type === 'insert') {
      return doc.slice(0, op.position) + (op.text || '') + doc.slice(op.position);
    } else if (op.type === 'delete') {
      return doc.slice(0, op.position) + doc.slice(op.position + (op.length || 0));
    }
    return doc;
  }
  
  function resetDocument(initialDoc) {
    return initialDoc || 'Hello';
  }
  
  module.exports = { applyOperation, resetDocument };
  