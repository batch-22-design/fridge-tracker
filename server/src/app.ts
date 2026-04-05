import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env.js';
import { itemsRouter } from './routes/items.js';
import { aiRouter } from './routes/ai.js';
import { shoppingRouter } from './routes/shopping.js';
import { pushRouter } from './routes/push.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/items', itemsRouter);
  app.use('/ai', aiRouter);
  app.use('/shopping', shoppingRouter);
  app.use('/push', pushRouter);

  app.use(errorHandler);
  return app;
}
