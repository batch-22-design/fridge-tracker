import webPush from 'web-push';
import { env } from '../env.js';

export function initPush() {
  webPush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function sendNotification(
  subscription: object,
  payload: { title: string; body: string }
) {
  await webPush.sendNotification(
    subscription as webPush.PushSubscription,
    JSON.stringify(payload)
  );
}
