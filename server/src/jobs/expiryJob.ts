import { schedule } from 'node-cron';
import { query } from '../db.js';
import { sendNotification } from '../services/pushService.js';

const HOUSEHOLD_ID = 1;

export function startExpiryJob() {
  // Runs daily at 8am
  schedule('0 8 * * *', async () => {
    console.log('Running expiry check...');
    try {
      // Find items expiring in 1 or 3 days
      const expiring = await query<{
        item_name: string;
        expiry_date: string;
        days_until_expiry: number;
      }>(
        `SELECT i.name as item_name, i.expiry_date,
                EXTRACT(DAY FROM i.expiry_date - CURRENT_DATE)::int as days_until_expiry
         FROM items i
         WHERE i.removed_at IS NULL
           AND i.expiry_date IS NOT NULL
           AND i.expiry_date - CURRENT_DATE IN (1, 3)
           AND i.household_id = $1`,
        [HOUSEHOLD_ID]
      );

      const subs = await query<{ subscription_json: object }>(
        'SELECT subscription_json FROM push_subscriptions WHERE household_id = $1',
        [HOUSEHOLD_ID]
      );

      for (const item of expiring) {
        const isUrgent = item.days_until_expiry === 1;
        const payload = {
          title: isUrgent ? '⚠️ Expiring today!' : '🕐 Expiring soon',
          body: `${item.item_name} expires ${isUrgent ? 'today' : 'in 3 days'}`,
        };
        for (const sub of subs) {
          await sendNotification(sub.subscription_json, payload).catch(console.error);
        }
      }
    } catch (err) {
      console.error('Expiry job error:', err);
    }
  });
  console.log('Expiry check job scheduled (daily 8am)');
}
