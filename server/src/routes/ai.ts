import { Router } from 'express';
import { query } from '../db.js';
import { getMealSuggestions, getRestockPredictions } from '../services/aiService.js';

export const aiRouter = Router();

const HOUSEHOLD_ID = 1;

// POST /ai/meals — get meal suggestions from current inventory
aiRouter.post('/meals', async (_req, res) => {
  const items = await query(
    'SELECT name, category, quantity, unit FROM items WHERE household_id = $1 AND removed_at IS NULL',
    [HOUSEHOLD_ID]
  );
  const suggestions = await getMealSuggestions(items as { name: string; category: string; quantity: number; unit: string }[]);
  if (!suggestions) {
    res.status(503).json({ error: 'AI service unavailable, please try again later' });
    return;
  }
  res.json({ suggestions });
});

// GET /ai/restock — restock predictions based on consumption history
aiRouter.get('/restock', async (_req, res) => {
  const log = await query(
    `SELECT i.name, i.category, cl.removed_at, cl.reason
     FROM consumption_log cl
     JOIN items i ON i.id = cl.item_id
     WHERE cl.household_id = $1
     ORDER BY cl.removed_at DESC
     LIMIT 200`,
    [HOUSEHOLD_ID]
  );
  const predictions = await getRestockPredictions(log as { name: string; category: string; removed_at: string; reason: string }[]);
  if (!predictions) {
    res.status(503).json({ error: 'AI service unavailable, please try again later' });
    return;
  }
  res.json({ predictions });
});
