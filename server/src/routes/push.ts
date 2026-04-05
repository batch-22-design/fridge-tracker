import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { sendNotification } from '../services/pushService.js';

export const pushRouter = Router();

const HOUSEHOLD_ID = 1;

// POST /push/subscribe — save push subscription
pushRouter.post('/subscribe', async (req, res) => {
  const { subscription } = z.object({ subscription: z.record(z.unknown()) }).parse(req.body);
  await query(
    'INSERT INTO push_subscriptions (household_id, subscription_json) VALUES ($1, $2)',
    [HOUSEHOLD_ID, JSON.stringify(subscription)]
  );
  res.status(201).json({ ok: true });
});

// POST /push/test — send a test notification
pushRouter.post('/test', async (_req, res) => {
  const subs = await query<{ subscription_json: object }>(
    'SELECT subscription_json FROM push_subscriptions WHERE household_id = $1',
    [HOUSEHOLD_ID]
  );
  if (!subs.length) {
    res.status(404).json({ error: 'No push subscription found' });
    return;
  }
  await sendNotification(subs[0].subscription_json, {
    title: 'Fridge Tracker',
    body: 'Push notifications are working!',
  });
  res.json({ ok: true });
});
