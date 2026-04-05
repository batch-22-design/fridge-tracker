import { createApp } from './app.js';
import { env } from './env.js';
import { initPush } from './services/pushService.js';
import { startExpiryJob } from './jobs/expiryJob.js';

initPush();

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  startExpiryJob();
});
