import { useNavigate } from 'react-router-dom';
import { Icon, addCollection } from '@iconify/react';
import ExpiryBadge from './ExpiryBadge';
import { getFoodIcon } from '../utils/foodEmoji';
import { notoFoodCollection } from '../utils/notoFoodCollection';
import type { Item } from '../api/items';

addCollection(notoFoodCollection as Parameters<typeof addCollection>[0]);

interface Props {
  item: Item;
  onRemove: (id: number) => void;
}

export default function ItemCard({ item, onRemove }: Props) {
  const navigate = useNavigate();

  const subParts = [
    item.quantity ? `${item.quantity} ${item.unit ?? ''}`.trim() : '',
    item.category ?? '',
  ].filter(Boolean);

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
      <button className="flex-1 text-left" onClick={() => navigate(`/items/${item.id}`)}>
        <p className="font-medium text-gray-900 flex items-center gap-2">
          <Icon icon={getFoodIcon(item.name)} width={22} height={22} className="shrink-0" />
          {item.name}
        </p>
        <p className="text-sm text-gray-500">{subParts.join(' · ')}</p>
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
