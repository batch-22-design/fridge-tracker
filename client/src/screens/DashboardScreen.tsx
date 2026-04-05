import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { itemsApi } from '../api/items';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Dairy', 'Meat', 'Produce', 'Grains', 'Drinks', 'Condiments', 'Other'];

export default function DashboardScreen() {
  const { items, loading, error, refresh } = useItems();
  const [category, setCategory] = useState('All');
  const navigate = useNavigate();

  const filtered = category === 'All' ? items : items.filter((i) => i.category === category);

  const handleRemove = async (id: number) => {
    await itemsApi.remove(id, 'used');
    refresh();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Fridge & Pantry</h1>
        <button
          onClick={() => navigate('/add')}
          className="bg-green-600 text-white text-sm rounded-full px-4 py-1.5 font-medium"
        >
          + Add
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
              category === cat
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🥦</p>
          <p>Nothing here yet</p>
          <button
            onClick={() => navigate('/add')}
            className="mt-4 text-green-600 text-sm font-medium"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
