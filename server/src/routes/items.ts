import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { lookupBarcode } from '../services/barcodeService.js';
import { extractFromImage } from '../services/aiService.js';

export const itemsRouter = Router();

const HOUSEHOLD_ID = 1;

const itemSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  expiry_date: z.string().optional(),
  qr_token: z.string().optional(),
});

itemsRouter.get('/', async (_req, res) => {
  const items = await query(
    `SELECT * FROM items
     WHERE household_id = $1 AND removed_at IS NULL
     ORDER BY expiry_date ASC NULLS LAST, added_at DESC`,
    [HOUSEHOLD_ID]
  );
  res.json(items);
});

itemsRouter.post('/', async (req, res) => {
  const body = itemSchema.parse(req.body);
  const [item] = await query(
    `INSERT INTO items (household_id, name, category, quantity, unit, expiry_date, qr_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (qr_token) DO UPDATE SET
       name = EXCLUDED.name,
       category = EXCLUDED.category,
       quantity = EXCLUDED.quantity,
       unit = EXCLUDED.unit,
       expiry_date = EXCLUDED.expiry_date,
       removed_at = NULL,
       added_at = NOW()
     RETURNING *`,
    [HOUSEHOLD_ID, body.name, body.category ?? null, body.quantity ?? null, body.unit ?? null, body.expiry_date ?? null, body.qr_token ?? null]
  );
  res.status(201).json(item);
});

itemsRouter.get('/qr/:token', async (req, res) => {
  const [item] = await query(
    'SELECT * FROM items WHERE qr_token = $1 AND removed_at IS NULL',
    [req.params.token]
  );
  if (!item) { res.status(404).json({ error: 'QR code not found' }); return; }
  res.json(item);
});

itemsRouter.put('/:id', async (req, res) => {
  const body = itemSchema.partial().parse(req.body);
  const [item] = await query(
    `UPDATE items SET
       name = COALESCE($1, name),
       category = COALESCE($2, category),
       quantity = COALESCE($3, quantity),
       unit = COALESCE($4, unit),
       expiry_date = COALESCE($5, expiry_date),
       qr_token = COALESCE($6, qr_token)
     WHERE id = $7 AND household_id = $8 AND removed_at IS NULL
     RETURNING *`,
    [body.name ?? null, body.category ?? null, body.quantity ?? null, body.unit ?? null, body.expiry_date ?? null, body.qr_token ?? null, req.params.id, HOUSEHOLD_ID]
  );
  if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
  res.json(item);
});

itemsRouter.delete('/:id', async (req, res) => {
  const reason = (req.body.reason as string) ?? 'used';
  const [item] = await query(
    `UPDATE items SET removed_at = NOW()
     WHERE id = $1 AND household_id = $2 AND removed_at IS NULL
     RETURNING *`,
    [req.params.id, HOUSEHOLD_ID]
  );
  if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
  await query(
    'INSERT INTO consumption_log (item_id, household_id, reason) VALUES ($1, $2, $3)',
    [(item as { id: number }).id, HOUSEHOLD_ID, reason]
  );
  res.json({ ok: true });
});

itemsRouter.post('/scan', async (req, res) => {
  const { barcode } = z.object({ barcode: z.string() }).parse(req.body);
  const product = await lookupBarcode(barcode);
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json(product);
});

itemsRouter.post('/extract', async (req, res) => {
  const { image, mimeType } = z.object({
    image: z.string(),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  }).parse(req.body);
  const extracted = await extractFromImage(image, mimeType);
  if (!extracted) { res.status(422).json({ error: 'Could not extract items from image' }); return; }
  res.json(extracted);
});
