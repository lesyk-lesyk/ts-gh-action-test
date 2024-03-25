import express from 'express';

const app = express();
const port = 3000;

const stubResponseStatus = {
  id: 'test-push-id',
  remoteId: 'test-remote-id',
  commit: {
    message: 'test-commit-message',
    branchName: 'test-branch-name',
    author: {
      name: 'test-author-name',
      email: 'test-author-email',
      image: null
    }
  },
  remote: { commits: [] },
  isOutdated: false,
  isMainBranch: true,
  hasChanges: true,
  status: {
    preview: {
      scorecard: [],
      deploy: {
        url: 'https://preview-test-url',
        status: 'success'
      }
    },
    production: {
      scorecard: [],
      deploy: {
        url: 'https://production-test-url',
        status: 'success'
      }
    }
  }
};

app.get('*', (req, res) => {
  res.json(stubResponseStatus);
});

app.post('*', (req, res) => {
  res.json({
    id: 'test-id-01',
    mountPath: 'test-mount-path'
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Fake server listening on port ${port}`);
});
