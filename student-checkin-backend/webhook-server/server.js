const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const SECRET = 'your_webhook_secret'; // optional verification

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const event = req.headers['x-github-event'];

  if (event === 'push') {
    console.log('📦 Push received — triggering deployment...');

    exec('cd ~/Student-Checkin-System/student-checkin-backend && ./deploy.sh', (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Deployment error:', stderr);
        return res.status(500).send('Deployment failed');
      }

      console.log('✅ Deployment output:\n', stdout);
      res.status(200).send('Deployed successfully');
    });
  } else {
    res.status(400).send('Ignored non-push event');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
});
