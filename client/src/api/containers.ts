import { api } from './client';

export interface Container {
  id: number;
  household_id: number;
  qr_token: string;
  name?: string;
  photo?: string;
  created_at: string;
  current_food?: string;
  current_expiry?: string;
}

export const containersApi = {
  list: () => api.get<Container[]>('/containers').then((r) => r.data),

  getByQrToken: (token: string) =>
    api.get<Container>(`/containers/qr/${token}`).then((r) => r.data),

  save: (data: { qr_token: string; name?: string; photo?: string }) =>
    api.post<Container>('/containers', data).then((r) => r.data),

  update: (id: number, data: { name?: string; photo?: string }) =>
    api.put<Container>(`/containers/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/containers/${id}`).then((r) => r.data),
};
