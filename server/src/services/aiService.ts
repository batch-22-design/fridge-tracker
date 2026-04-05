import Anthropic from '@anthropic-ai/sdk';
import { env } from '../env.js';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

export interface ExtractedItem {
  name: string;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
}

export interface RestockPrediction {
  name: string;
  category?: string;
  estimatedDaysUntilEmpty: number;
  confidence: 'high' | 'medium' | 'low';
}

export async function getMealSuggestions(
  items: { name: string; category?: string; quantity?: number; unit?: string }[]
): Promise<string[] | null> {
  try {
    const inventoryText = items
      .map((i) => `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit ?? ''})`.trim() : ''}`)
      .join(', ');

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `I have these items in my fridge/pantry: ${inventoryText}

Suggest 3-5 meal ideas I could make. For each meal, briefly mention which ingredients from my list it uses.
Return a JSON array of strings, e.g. ["Pasta carbonara (uses: eggs, pasta)", ...]
Return only the JSON array, no other text.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : null;
    if (!text) return null;
    return JSON.parse(text) as string[];
  } catch (err) {
    console.error('getMealSuggestions error:', err);
    return null;
  }
}

export async function getRestockPredictions(
  log: { name: string; category?: string; removed_at: string; reason: string }[]
): Promise<RestockPrediction[] | null> {
  try {
    if (!log.length) return [];

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Here is a consumption log of items removed from a household fridge/pantry:
${JSON.stringify(log, null, 2)}

Based on the consumption patterns, predict which items are likely to run out soon.
Return a JSON array with objects: { name, category, estimatedDaysUntilEmpty, confidence: "high"|"medium"|"low" }
Return only the JSON array, no other text.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : null;
    if (!text) return null;
    return JSON.parse(text) as RestockPrediction[];
  } catch (err) {
    console.error('getRestockPredictions error:', err);
    return null;
  }
}

export async function extractFromImage(
  base64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
): Promise<ExtractedItem[] | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            {
              type: 'text',
              text: `Extract all food items from this receipt or photo.
For each item return: name, quantity (number), unit (e.g. "kg", "L", "pcs"), and expiry_date if visible (ISO format YYYY-MM-DD).
Return a JSON array of objects: [{ name, quantity, unit, expiry_date }]
If a field is not visible, omit it. Return only the JSON array, no other text.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : null;
    if (!text) return null;
    return JSON.parse(text) as ExtractedItem[];
  } catch (err) {
    console.error('extractFromImage error:', err);
    return null;
  }
}
