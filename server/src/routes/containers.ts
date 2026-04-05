import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';

export const containersRouter = Router();

const HOUSEHOLD_ID = 1;

containersRouter.get('/', async (_req, res) => {
  const rows = await query(
    `SELECT c.*, i.name AS current_food, i.expiry_date AS current_expiry
     FROM containers c
     LEFT JOIN items i ON i.qr_token = c.qr_token AND i.removed_at IS NULL
     WHERE c.household_id = $1
     ORDER BY c.created_at DESC`,
    [HOUSEHOLD_ID]
  );
  res.json(rows);
});

containersRouter.get('/qr/:token', async (req, res) => {
  const [row] = await query(
    'SELECT * FROM containers WHERE qr_token = $1 AND household_id = $2',
    [req.params.token, HOUSEHOLD_ID]
  );
  if (!row) { res.status(404).json({ error: 'Container not found' }); return; }
  res.json(row);
});

containersRouter.post('/', async (req, res) => {
  const body = z.object({
    qr_token: z.string(),
    name: z.string().optional(),
    photo: z.string().optional(),
  }).parse(req.body);

  const [container] = await query(
    `INSERT INTO containers (household_id, qr_token, name, photo)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (qr_token) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, containers.name),
       photo = COALESCE(EXCLUDED.photo, containers.photo)
     RETURNING *`,
    [HOUSEHOLD_ID, body.qr_token, body.name, body.photo]
  );
  res.status(201).json(container);
});

containersRouter.put('/:id', async (req, res) => {
  const body = z.object({
    name: z.string().optional(),
    photo: z.string().optional(),
  }).parse(req.body);

  const [container] = await query(
    `UPDATE containers SET
       name = COALESCE($1, name),
       photo = COALESCE($2, photo)
     WHERE id = $3 AND household_id = $4
     RETURNING *`,
    [body.name, body.photo, req.params.id, HOUSEHOLD_ID]
  );
  if (!container) { res.status(404).json({ error: 'Container not found' }); return; }
  res.json(container);
});

containersRouter.delete('/:id', async (req, res) => {
  await query('DELETE FROM containers WHERE id = $1 AND household_id = $2', [req.params.id, HOUSEHOLD_ID]);
  res.json({ ok: true });
});
