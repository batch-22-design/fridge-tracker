import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { itemsApi, type Item } from '../api/items';

export default function QrItemScreen() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found' | 'register' | 'done'>('loading');
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!token) return;
    itemsApi.getByQrToken(token).then((i) => {
      setItem(i);
      setStatus('found');
    }).catch(() => {
      setStatus('not-found');
    });
  }, [token]);

  const markUsed = async () => {
    if (!item) return;
    await itemsApi.remove(item.id, 'used');
    setStatus('done');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Looking up sticker...</p>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center space-y-4">
          <p className="text-5xl">✅</p>
          <p className="text-lg font-semibold text-gray-900">Marked as used</p>
          <button onClick={() => navigate('/dashboard')} className="text-green-600 text-sm font-medium">
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'found' && item) {
    const formatDate = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-3xl mb-3">🥡</p>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            {item.expiry_date && (
              <p className="text-gray-500 mt-2">Eat by <span className="font-medium text-gray-700">{formatDate(item.expiry_date)}</span></p>
            )}
          </div>
          <button
            onClick={markUsed}
            className="w-full bg-green-600 text-white rounded-xl py-4 text-base font-medium"
          >
            Mark as used
          </button>
          <button
            onClick={() => navigate(`/items/${item.id}`)}
            className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-medium"
          >
            Edit details
          </button>
        </div>
      </div>
    );
  }

  if (status === 'not-found' || status === 'register') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-2">
            <p className="text-3xl mb-2">🏷️</p>
            <h1 className="text-lg font-bold text-gray-900">New sticker</h1>
            <p className="text-sm text-gray-500">What's in this container?</p>
          </div>
          <RegisterForm token={token!} onDone={() => navigate('/dashboard')} />
        </div>
      </div>
    );
  }

  return null;
}

function RegisterForm({ token, onDone }: { token: string; onDone: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<{ name: string; expiry_date: string }>();

  const onSubmit = async (data: { name: string; expiry_date: string }) => {
    await itemsApi.create({ name: data.name, expiry_date: data.expiry_date, qr_token: token, category: 'Leftovers' });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What is it? *</label>
        <input
          {...register('name', { required: 'Required' })}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
          placeholder="e.g. Leftover pasta"
          autoFocus
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Eat by *</label>
        <input
          type="date"
          {...register('expiry_date', { required: 'Required' })}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
        />
        {errors.expiry_date && <p className="text-red-500 text-xs mt-1">{errors.expiry_date.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white rounded-xl py-4 text-base font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
