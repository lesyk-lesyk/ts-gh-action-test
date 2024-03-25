import express from 'express';
const app = express();
const port = 3050;

app.get('*', (req, res) => {
  res.json({ test: 'test' });
});

app.listen(port, () => {
  console.log(`Fake server listening on port ${port}`);
});
