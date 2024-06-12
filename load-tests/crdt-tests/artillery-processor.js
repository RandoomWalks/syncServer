module.exports = {
  assertDocument: function (context, events, done) {
    const expected = context.vars.expected;
    const document = context.vars.document;

    if (document !== expected) {
      throw new Error(`Document assertion failed. Expected: ${expected}, but got: ${document}`);
    }

    return done();
  }
};