import { api } from './client';

export const authApi = {
  register: (data: { email: string; password: string; name: string; householdName: string }) =>
    api.post<{ token: string }>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string }>('/auth/login', data).then((r) => r.data),

  invite: () =>
    api.post<{ inviteUrl: string }>('/auth/invite').then((r) => r.data),
};
