import { api } from './client';

export interface RestockPrediction {
  name: string;
  category?: string;
  estimatedDaysUntilEmpty: number;
  confidence: 'high' | 'medium' | 'low';
}

export const aiApi = {
  getMeals: () =>
    api.post<{ suggestions: string[] }>('/ai/meals').then((r) => r.data),

  getRestock: () =>
    api.get<{ predictions: RestockPrediction[] }>('/ai/restock').then((r) => r.data),
};
