import { useState } from 'react';
import { useShopping } from '../hooks/useShopping';
import { shoppingApi } from '../api/shopping';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ShoppingListScreen() {
  const { items, loading, error, refresh } = useShopping();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const addItem = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await shoppingApi.create({ name: newName.trim() });
    setNewName('');
    setAdding(false);
    refresh();
  };

  const toggle = async (id: number, checked: boolean) => {
    await shoppingApi.update(id, { checked: !checked });
    refresh();
  };

  const remove = async (id: number) => {
    await shoppingApi.remove(id);
    refresh();
  };

  const addToInventory = async (id: number) => {
    await shoppingApi.addToInventory(id);
    refresh();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>;

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Shopping List</h1>

      {/* Add item */}
      <div className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={addItem} disabled={adding} className="bg-green-600 text-white px-4 rounded-lg text-sm font-medium">
          Add
        </button>
      </div>

      {/* Unchecked items */}
      <div className="space-y-2 mb-6">
        {unchecked.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
            <button onClick={() => toggle(item.id, item.checked)} className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0" />
            <span className="flex-1 text-sm text-gray-900">{item.name}</span>
            <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-400 text-lg">×</button>
          </div>
        ))}
      </div>

      {/* Checked items */}
      {checked.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">In basket</p>
          <div className="space-y-2">
            {checked.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <button onClick={() => toggle(item.id, item.checked)} className="w-5 h-5 bg-green-600 border-2 border-green-600 rounded flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </button>
                <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                <button onClick={() => addToInventory(item.id)} className="text-green-600 text-xs font-medium">
                  + Fridge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-center py-12 text-gray-400">Your shopping list is empty</p>
      )}
    </div>
  );
}
