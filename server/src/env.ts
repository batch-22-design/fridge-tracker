import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_EMAIL: z.string().startsWith('mailto:', 'VAPID_EMAIL must start with mailto:'),
  PORT: z.coerce.number().default(3001),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = schema.parse(process.env);
