import { api } from './client';

export const pushApi = {
  subscribe: (subscription: PushSubscription) =>
    api.post('/push/subscribe', { subscription: subscription.toJSON() }).then((r) => r.data),

  test: () => api.post('/push/test').then((r) => r.data),
};
