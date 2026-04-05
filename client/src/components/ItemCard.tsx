import { useNavigate } from 'react-router-dom';
import ExpiryBadge from './ExpiryBadge';
import type { Item } from '../api/items';

interface Props {
  item: Item;
  onRemove: (id: number) => void;
}

export default function ItemCard({ item, onRemove }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
      <button className="flex-1 text-left" onClick={() => navigate(`/items/${item.id}`)}>
        <p className="font-medium text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-500">
          {item.quantity ? `${item.quantity} ${item.unit ?? ''}`.trim() : ''}
          {item.category ? ` · ${item.category}` : ''}
        </p>
      </button>
      <div className="flex items-center gap-2">
        <ExpiryBadge expiryDate={item.expiry_date} />
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 p-1"
          aria-label="Mark as used"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
