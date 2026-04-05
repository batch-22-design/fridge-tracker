import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { itemsApi, type ItemInput } from '../api/items';

type Tab = 'manual' | 'scan' | 'receipt';

export default function AddItemScreen() {
  const [tab, setTab] = useState<Tab>('manual');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Add Item</h1>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {(['manual', 'scan', 'receipt'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t === 'manual' ? '✏️ Manual' : t === 'scan' ? '📷 Scan' : '🧾 Receipt'}
          </button>
        ))}
      </div>

      {tab === 'manual' && <ManualForm />}
      {tab === 'scan' && <ScanForm />}
      {tab === 'receipt' && <ReceiptForm />}
    </div>
  );
}

function ManualForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ItemInput>();
  const navigate = useNavigate();

  const onSubmit = async (data: ItemInput) => {
    await itemsApi.create(data);
    navigate('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          {...register('name', { required: 'Required' })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. Milk"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            step="any"
            {...register('quantity', { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <input
            {...register('unit')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="kg, L, pcs"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select {...register('category')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">— none —</option>
          {['Dairy', 'Meat', 'Produce', 'Grains', 'Drinks', 'Condiments', 'Other'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
        <input
          type="date"
          {...register('expiry_date')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add to fridge'}
      </button>
    </form>
  );
}

function ScanForm() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'found' | 'error'>('idle');
  const [product, setProduct] = useState<{ name: string; category?: string } | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<import('@zxing/browser').BrowserMultiFormatReader | null>(null);
  const navigate = useNavigate();

  const startScan = async (facing: 'environment' | 'user' = facingMode) => {
    readerRef.current?.reset();
    setStatus('scanning');
    try {
      const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import('@zxing/browser');
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE,
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader;

      await reader.decodeFromConstraints(
        { video: { facingMode: facing } },
        videoRef.current!,
        async (result, err) => {
          if (result) {
            reader.reset();
            readerRef.current = null;
            try {
              const p = await itemsApi.scan(result.getText());
              setProduct(p);
              setStatus('found');
            } catch {
              setStatus('error');
            }
          }
          void err;
        }
      );
    } catch {
      setStatus('error');
    }
  };

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startScan(next);
  };

  const stop = () => {
    readerRef.current?.reset();
    readerRef.current = null;
    setStatus('idle');
  };

  const addProduct = async () => {
    if (!product) return;
    await itemsApi.create({ name: product.name, category: product.category });
    navigate('/dashboard');
  };

  return (
    <div className="space-y-4">
      {status === 'idle' && (
        <button onClick={() => startScan()} className="w-full bg-green-600 text-white rounded-xl py-4 text-lg font-medium">
          📷 Start Scanning
        </button>
      )}

      {status === 'scanning' && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-xl opacity-60" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={flipCamera} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-sm font-medium">
              🔄 Flip Camera
            </button>
            <button onClick={stop} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-sm font-medium">
              Cancel
            </button>
          </div>
          <p className="text-center text-sm text-gray-500">Point at a barcode</p>
        </div>
      )}

      {status === 'found' && product && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-lg font-semibold text-gray-900">{product.name}</p>
            {product.category && <p className="text-gray-500 text-sm mt-1">{product.category}</p>}
          </div>
          <button onClick={addProduct} className="w-full bg-green-600 text-white rounded-lg py-3 font-medium">
            Add to fridge
          </button>
          <button onClick={() => { setProduct(null); startScan(); }} className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm">
            Scan another
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3 text-center">
          <p className="text-red-500">Product not found</p>
          <button onClick={() => startScan()} className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function ReceiptForm() {
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ItemInput[] | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const items = await itemsApi.extract(base64, file.type as 'image/jpeg');
      setExtracted(items);
    } catch {
      alert('Could not extract items. Please try a clearer photo.');
    } finally {
      setExtracting(false);
    }
  };

  const saveAll = async () => {
    if (!extracted) return;
    setSaving(true);
    await Promise.all(extracted.map((item) => itemsApi.create(item)));
    navigate('/dashboard');
  };

  return (
    <div className="space-y-4">
      <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400">
        <span className="text-4xl block mb-2">🧾</span>
        <span className="text-gray-500 text-sm">Tap to upload a receipt or photo</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>

      {extracting && <p className="text-center text-gray-500 text-sm">Extracting items...</p>}

      {extracted && (
        <div className="space-y-3">
          <p className="font-medium text-gray-700">{extracted.length} items found</p>
          {extracted.map((item, i) => (
            <div key={i} className="bg-white rounded-lg px-3 py-2 shadow-sm text-sm">
              <span className="font-medium">{item.name}</span>
              {item.quantity && <span className="text-gray-500 ml-2">{item.quantity} {item.unit}</span>}
              {item.expiry_date && <span className="text-gray-400 ml-2">exp {item.expiry_date}</span>}
            </div>
          ))}
          <button
            onClick={saveAll}
            disabled={saving}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : `Add all ${extracted.length} items`}
          </button>
        </div>
      )}
    </div>
  );
}
