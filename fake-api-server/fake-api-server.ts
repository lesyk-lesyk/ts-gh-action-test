import express from 'express';

const app = express();
const port = 3000;

app.get('*', (req, res) => {
  res.json({ test: 'test' });
});
app.post('*', (req, res) => {
  res.json({ id: 'test-id-01', mountPath: 'test-mount-path' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fake server listening on port ${port}`);
});
