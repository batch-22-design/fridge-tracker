import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { itemsApi, type Item } from '../api/items';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Leftovers', 'Dairy', 'Meat', 'Produce', 'Grains', 'Drinks', 'Condiments', 'Other'];

const GROUPS = [
  { key: 'overdue',  label: '🚨 Should have been eaten by now', color: 'text-red-600' },
  { key: 'today',   label: '⚠️ Eat today',                     color: 'text-orange-500' },
  { key: 'soon',    label: '🕐 Eat in the next 3 days',        color: 'text-yellow-600' },
  { key: 'week',    label: '📅 This week',                     color: 'text-blue-600' },
  { key: 'later',   label: '✅ Good for now',                  color: 'text-green-600' },
  { key: 'unknown', label: '📦 No date set',                   color: 'text-gray-500' },
];

function groupItem(item: Item): string {
  if (!item.expiry_date) return 'unknown';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(item.expiry_date.slice(0, 10) + 'T00:00:00');
  const days = Math.round((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0)  return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  if (days <= 7) return 'week';
  return 'later';
}

export default function DashboardScreen() {
  const { items, loading, error, refresh } = useItems();
  const [category, setCategory] = useState('All');
  const navigate = useNavigate();

  const filtered = category === 'All'
    ? items
    : category === 'Leftovers'
      ? items.filter((i) => !!i.qr_token)
      : items.filter((i) => i.category === category);

  const handleRemove = async (id: number) => {
    await itemsApi.remove(id, 'used');
    refresh();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>;

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: filtered.filter((i) => groupItem(i) === g.key),
  })).filter((g) => g.items.length > 0);

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
          <button onClick={() => navigate('/add')} className="mt-4 text-green-600 text-sm font-medium">
            Add your first item
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.key}>
              <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${group.color}`}>
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <ItemCard key={item.id} item={item} onRemove={handleRemove} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
