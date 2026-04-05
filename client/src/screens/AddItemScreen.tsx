import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { itemsApi, type ItemInput } from '../api/items';

type Tab = 'manual' | 'scan' | 'receipt' | 'leftovers';

export default function AddItemScreen() {
  const [tab, setTab] = useState<Tab>('manual');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Add Item</h1>

      {/* Tabs */}
      <div className="grid grid-cols-4 bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {([
          ['manual', '✏️', 'Manual'],
          ['scan', '📷', 'Scan'],
          ['leftovers', '🥡', 'Leftovers'],
          ['receipt', '🧾', 'Receipt'],
        ] as [Tab, string, string][]).map(([t, icon, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <span className="block">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {tab === 'manual' && <ManualForm />}
      {tab === 'scan' && <ScanForm />}
      {tab === 'leftovers' && <LeftoversForm />}
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
  const [status, setStatus] = useState<'idle' | 'scanning' | 'found' | 'error' | 'qr-found' | 'qr-new'>('idle');
  const [product, setProduct] = useState<{ name: string; category?: string } | null>(null);
  const [qrItem, setQrItem] = useState<import('../api/items').Item | null>(null);
  const [scannedUuid, setScannedUuid] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const navigate = useNavigate();

  const startScan = async (facing: 'environment' | 'user' = facingMode) => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setStatus('scanning');
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: facing } } },
        videoRef.current!,
        async (result, err) => {
          if (result) {
            controls.stop();
            controlsRef.current = null;
            const text = result.getText();
            const uuidMatch = text.match(UUID_RE);
            if (uuidMatch) {
              const uuid = uuidMatch[0];
              setScannedUuid(uuid);
              try {
                const item = await itemsApi.getByQrToken(uuid);
                setQrItem(item);
                setStatus('qr-found');
              } catch {
                setStatus('qr-new');
              }
            } else {
              try {
                const p = await itemsApi.scan(text);
                setProduct(p);
                setStatus('found');
              } catch {
                setStatus('error');
              }
            }
          }
          void err;
        }
      );
      controlsRef.current = controls;
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
    controlsRef.current?.stop();
    controlsRef.current = null;
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

      {status === 'qr-found' && qrItem && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-lg font-semibold text-gray-900">{qrItem.name}</p>
            {qrItem.expiry_date && (
              <p className="text-gray-500 text-sm mt-1">Eat by {qrItem.expiry_date}</p>
            )}
          </div>
          <button
            onClick={async () => { await itemsApi.remove(qrItem.id, 'used'); navigate('/dashboard'); }}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-medium"
          >
            Mark as used
          </button>
          <button onClick={() => startScan()} className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm">
            Scan another
          </button>
        </div>
      )}

      {status === 'qr-new' && (
        <QrRegisterForm uuid={scannedUuid} onDone={() => navigate('/dashboard')} onCancel={() => setStatus('idle')} />
      )}
    </div>
  );
}

function QrRegisterForm({ uuid, onDone, onCancel }: { uuid: string; onDone: () => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ name: string; expiry_date: string }>();
  const onSubmit = async (data: { name: string; expiry_date: string }) => {
    await itemsApi.create({ name: data.name, expiry_date: data.expiry_date, qr_token: uuid, category: 'Leftovers' });
    onDone();
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center">New sticker — what's in this container?</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What is it? *</label>
          <input
            {...register('name', { required: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Leftover pasta"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Eat by *</label>
          <input
            type="date"
            {...register('expiry_date', { required: true })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="w-full text-gray-500 text-sm py-2">
          Cancel
        </button>
      </form>
    </div>
  );
}

function LeftoversForm() {
  const [state, setState] = useState<'form' | 'qr'>('form');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ name: string; expiry_date: string }>();
  const navigate = useNavigate();

  const onSubmit = async (data: { name: string; expiry_date: string }) => {
    const uuid = crypto.randomUUID();
    const qrUrl = `${window.location.origin}/qr/${uuid}`;
    const { default: QRCode } = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });
    await itemsApi.create({ name: data.name, expiry_date: data.expiry_date, qr_token: uuid, category: 'Leftovers' });
    setQrDataUrl(dataUrl);
    setState('qr');
  };

  if (state === 'qr') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500">Print this sticker and stick it on the container</p>
        <img src={qrDataUrl} alt="QR sticker" className="mx-auto rounded-xl border border-gray-200" />
        <a
          href={qrDataUrl}
          download="fridge-sticker.png"
          className="block w-full bg-green-600 text-white rounded-lg py-3 font-medium"
        >
          ⬇️ Download Sticker
        </a>
        <button onClick={() => setState('form')} className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm">
          Add Another
        </button>
        <button onClick={() => navigate('/dashboard')} className="w-full text-gray-500 text-sm py-2">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What is it? *</label>
        <input
          {...register('name', { required: 'Required' })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {errors.expiry_date && <p className="text-red-500 text-xs mt-1">{errors.expiry_date.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Generating...' : 'Generate Sticker'}
      </button>
    </form>
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
