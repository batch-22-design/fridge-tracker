import { api } from './client';

export interface ShoppingItem {
  id: number;
  household_id: number;
  name: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
  created_at: string;
}

export const shoppingApi = {
  list: () => api.get<ShoppingItem[]>('/shopping').then((r) => r.data),

  create: (data: { name: string; quantity?: number; unit?: string }) =>
    api.post<ShoppingItem>('/shopping', data).then((r) => r.data),

  update: (id: number, data: { checked?: boolean; name?: string }) =>
    api.put<ShoppingItem>(`/shopping/${id}`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/shopping/${id}`).then((r) => r.data),

  addToInventory: (id: number) =>
    api.post(`/shopping/${id}/add-to-inventory`).then((r) => r.data),
};
