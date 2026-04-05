import { useState, useEffect, useCallback } from 'react';
import { itemsApi, type Item } from '../api/items';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itemsApi.list();
      setItems(data);
      setError(null);
    } catch {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, error, refresh };
}
