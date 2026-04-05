import { api } from './client';

export interface Item {
  id: number;
  household_id: number;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  added_by?: number;
  added_by_name?: string;
  added_at: string;
  removed_at?: string;
}

export interface ItemInput {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  qr_token?: string;
}

export const itemsApi = {
  list: () => api.get<Item[]>('/items').then((r) => r.data),

  create: (data: ItemInput) => api.post<Item>('/items', data).then((r) => r.data),

  update: (id: number, data: Partial<ItemInput>) =>
    api.put<Item>(`/items/${id}`, data).then((r) => r.data),

  remove: (id: number, reason: 'used' | 'expired' | 'discarded' = 'used') =>
    api.delete(`/items/${id}`, { data: { reason } }).then((r) => r.data),

  scan: (barcode: string) =>
    api.post<{ name: string; category?: string }>('/items/scan', { barcode }).then((r) => r.data),

  extract: (image: string, mimeType: string) =>
    api.post<ItemInput[]>('/items/extract', { image, mimeType }).then((r) => r.data),

  getByQrToken: (token: string) =>
    api.get<Item>(`/items/qr/${token}`).then((r) => r.data),
};
