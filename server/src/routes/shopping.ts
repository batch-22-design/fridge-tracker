import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';

export const shoppingRouter = Router();

const HOUSEHOLD_ID = 1;

const itemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
});

// GET /shopping
shoppingRouter.get('/', async (_req, res) => {
  const items = await query(
    'SELECT * FROM shopping_list WHERE household_id = $1 ORDER BY checked ASC, created_at DESC',
    [HOUSEHOLD_ID]
  );
  res.json(items);
});

// POST /shopping
shoppingRouter.post('/', async (req, res) => {
  const body = itemSchema.parse(req.body);
  const [item] = await query(
    'INSERT INTO shopping_list (household_id, name, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
    [HOUSEHOLD_ID, body.name, body.quantity, body.unit]
  );
  res.status(201).json(item);
});

// PUT /shopping/:id — check/uncheck or rename
shoppingRouter.put('/:id', async (req, res) => {
  const body = z.object({ checked: z.boolean().optional(), name: z.string().optional() }).parse(req.body);
  const [item] = await query(
    `UPDATE shopping_list SET
       checked = COALESCE($1, checked),
       name = COALESCE($2, name)
     WHERE id = $3 AND household_id = $4
     RETURNING *`,
    [body.checked, body.name, req.params.id, HOUSEHOLD_ID]
  );
  if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
  res.json(item);
});

// DELETE /shopping/:id
shoppingRouter.delete('/:id', async (req, res) => {
  const [item] = await query(
    'DELETE FROM shopping_list WHERE id = $1 AND household_id = $2 RETURNING id',
    [req.params.id, HOUSEHOLD_ID]
  );
  if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
  res.json({ ok: true });
});

// POST /shopping/:id/add-to-inventory — move checked item to inventory
shoppingRouter.post('/:id/add-to-inventory', async (req, res) => {
  const [shopItem] = await query<{ name: string; quantity: number; unit: string }>(
    'SELECT name, quantity, unit FROM shopping_list WHERE id = $1 AND household_id = $2',
    [req.params.id, HOUSEHOLD_ID]
  );
  if (!shopItem) { res.status(404).json({ error: 'Item not found' }); return; }

  const [inventoryItem] = await query(
    'INSERT INTO items (household_id, name, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
    [HOUSEHOLD_ID, shopItem.name, shopItem.quantity, shopItem.unit]
  );
  await query('DELETE FROM shopping_list WHERE id = $1', [req.params.id]);
  res.status(201).json(inventoryItem);
});
