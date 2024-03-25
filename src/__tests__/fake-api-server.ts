import express from 'express';

const app = express();
const port = 3051;

app.get('*', (req, res) => {
  res.json({ test: 'test' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fake server listening on port ${port}`);
});
