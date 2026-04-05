import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useItems } from '../hooks/useItems';
import { itemsApi, type ItemInput } from '../api/items';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ItemDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loading, refresh } = useItems();
  const item = items.find((i) => i.id === Number(id));

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ItemInput>({
    values: item ? {
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiry_date: item.expiry_date,
    } : undefined,
  });

  if (loading) return <LoadingSpinner />;
  if (!item) return <p className="text-center py-8 text-gray-500">Item not found</p>;

  const isLeftover = !!item.qr_token;

  const onSubmit = async (data: ItemInput) => {
    await itemsApi.update(item.id, data);
    refresh();
    navigate('/dashboard');
  };

  const handleRemove = async (reason: 'used' | 'expired' | 'discarded') => {
    await itemsApi.remove(item.id, reason);
    navigate('/dashboard');
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-green-600 text-sm mb-4">← Back</button>
      <h1 className="text-xl font-bold text-gray-900 mb-6">{isLeftover ? 'Edit Leftover' : 'Edit Item'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input {...register('name', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{isLeftover ? 'Eat by' : 'Expiry date'}</label>
          <input type="date" {...register('expiry_date')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        {!isLeftover && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" step="any" {...register('quantity', { valueAsNumber: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input {...register('unit')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('category')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— none —</option>
                {['Leftovers', 'Dairy', 'Meat', 'Produce', 'Grains', 'Drinks', 'Condiments', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </>
        )}
        <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8 space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Mark as:</p>
        {(['used', 'expired', 'discarded'] as const).map((reason) => (
          <button
            key={reason}
            onClick={() => handleRemove(reason)}
            className="w-full border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm capitalize hover:border-red-300 hover:text-red-600"
          >
            {reason}
          </button>
        ))}
      </div>
    </div>
  );
}
