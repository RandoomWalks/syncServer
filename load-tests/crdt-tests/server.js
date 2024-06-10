const express = require('express');
const bodyParser = require('body-parser');
const { applyOperation, resetDocument } = require('./operations');

const app = express();
app.use(bodyParser.json());

let document = 'Hello';

app.post('/apply-operation', (req, res) => {
  const { operation } = req.body;
  document = applyOperation(document, operation);
  res.json({ document });
});

app.post('/reset-document', (req, res) => {
  const { initialDocument } = req.body;
  document = resetDocument(initialDocument);
  res.json({ document });
});

app.get('/document', (req, res) => {
  res.json({ document });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
