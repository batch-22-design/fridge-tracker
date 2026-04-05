import { useState } from 'react';
import { pushApi } from '../api/push';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePush() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await pushApi.subscribe(sub);
      setSubscribed(true);
    } catch (err) {
      console.error('Push subscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { subscribed, loading, subscribe };
}
