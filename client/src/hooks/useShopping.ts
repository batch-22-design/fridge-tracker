import { useState, useEffect, useCallback } from 'react';
import { shoppingApi, type ShoppingItem } from '../api/shopping';

export function useShopping() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shoppingApi.list();
      setItems(data);
      setError(null);
    } catch {
      setError('Failed to load shopping list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, error, refresh };
}
