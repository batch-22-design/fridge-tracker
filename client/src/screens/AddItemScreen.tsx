import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { nanoid } from 'nanoid';
import { itemsApi, type ItemInput } from '../api/items';

type Tab = 'manual' | 'scan' | 'leftovers' | 'stickers' | 'receipt';

export default function AddItemScreen() {
  const [tab, setTab] = useState<Tab>('manual');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Add Item</h1>

      {/* Tabs */}
      <div className="grid grid-cols-5 bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {([
          ['manual', '✏️', 'Manual'],
          ['scan', '📷', 'Scan'],
          ['leftovers', '🥡', 'Leftover'],
          ['stickers', '🏷️', 'Stickers'],
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
      {tab === 'stickers' && <StickerSheetForm />}
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
      const ID_RE = /[A-Za-z0-9_-]{10,}/;
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: facing } } },
        videoRef.current!,
        async (result, err) => {
          if (result) {
            controls.stop();
            controlsRef.current = null;
            const text = result.getText();
            const idMatch = text.match(ID_RE);
            if (idMatch) {
              const id = idMatch[0];
              setScannedUuid(id);
              try {
                const item = await itemsApi.getByQrToken(id);
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
  type LState = 'form' | 'link' | 'scanning' | 'qr';
  const [lstate, setLstate] = useState<LState>('form');
  const [foodData, setFoodData] = useState<{ name: string; expiry_date: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ name: string; expiry_date: string }>();
  const navigate = useNavigate();

  const onFormSubmit = (data: { name: string; expiry_date: string }) => {
    setFoodData(data);
    setLstate('link');
  };

  const makeNewSticker = async () => {
    if (!foodData) return;
    setGenerating(true);
    const id = nanoid(8);
    const qrUrl = `${window.location.origin}/qr/${id}`;
    const { default: QRCode } = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2, errorCorrectionLevel: 'L' });
    await itemsApi.create({ name: foodData.name, expiry_date: foodData.expiry_date, qr_token: id, category: 'Leftovers' });
    setQrDataUrl(dataUrl);
    setGenerating(false);
    setLstate('qr');
  };

  if (lstate === 'form') {
    return (
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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
        <button type="submit" className="w-full bg-green-600 text-white rounded-lg py-3 font-medium">
          Next →
        </button>
      </form>
    );
  }

  if (lstate === 'link') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 text-center mb-4">
          How do you want to tag <span className="font-medium text-gray-800">{foodData?.name}</span>?
        </p>
        <button
          onClick={() => setLstate('scanning')}
          className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-4 text-left shadow-sm"
        >
          <span className="text-2xl">📷</span>
          <div>
            <p className="font-medium text-gray-900 text-sm">Scan a sticker already on a container</p>
            <p className="text-xs text-gray-500 mt-0.5">Point camera at one of your pre-printed stickers</p>
          </div>
        </button>
        <button
          onClick={makeNewSticker}
          disabled={generating}
          className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-4 text-left shadow-sm disabled:opacity-50"
        >
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-medium text-gray-900 text-sm">Generate a new sticker</p>
            <p className="text-xs text-gray-500 mt-0.5">Create a QR code to print and stick on now</p>
          </div>
        </button>
        <button onClick={() => setLstate('form')} className="w-full text-gray-400 text-sm py-2">
          ← Back
        </button>
      </div>
    );
  }

  if (lstate === 'scanning') {
    return (
      <LeftoverStickerScanner
        foodData={foodData!}
        onDone={() => navigate('/dashboard')}
        onBack={() => setLstate('link')}
      />
    );
  }

  if (lstate === 'qr') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500">Print this sticker and stick it on the container</p>
        <img src={qrDataUrl} alt="QR sticker" className="mx-auto rounded-xl border border-gray-200 w-48 h-48" />
        <a
          href={qrDataUrl}
          download="fridge-sticker.png"
          className="block w-full bg-green-600 text-white rounded-lg py-3 font-medium"
        >
          ⬇️ Download Sticker
        </a>
        <button onClick={() => { setLstate('form'); setFoodData(null); setQrDataUrl(''); }} className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm">
          Add Another
        </button>
        <button onClick={() => navigate('/dashboard')} className="w-full text-gray-500 text-sm py-2">
          Done
        </button>
      </div>
    );
  }

  return null;
}

function LeftoverStickerScanner({
  foodData,
  onDone,
  onBack,
}: {
  foodData: { name: string; expiry_date: string };
  onDone: () => void;
  onBack: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<{ uuid: string; existingName: string } | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const ID_RE = /[A-Za-z0-9_-]{10,}/;

  const saveWithUuid = async (uuid: string) => {
    await itemsApi.create({ name: foodData.name, expiry_date: foodData.expiry_date, qr_token: uuid, category: 'Leftovers' });
    onDone();
  };

  const startScan = async (facing: 'environment' | 'user' = facingMode) => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(true);
    setError('');
    setConflict(null);
    let handled = false;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: facing } } },
        videoRef.current!,
        async (result, _err) => {
          if (!result || handled) return;
          handled = true;
          controlsRef.current?.stop();
          controlsRef.current = null;
          setScanning(false);
          const text = result.getText();
          const idMatch = text.match(ID_RE);
          if (!idMatch) {
            setError("That doesn't look like a fridge sticker. Try again.");
            handled = false;
            return;
          }
          const uuid = idMatch[0];
          let existingItem = null;
          try { existingItem = await itemsApi.getByQrToken(uuid); } catch { /* free to use */ }
          if (existingItem) {
            setConflict({ uuid, existingName: existingItem.name });
            return;
          }
          try {
            await saveWithUuid(uuid);
          } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error ?? (e as Error)?.message ?? 'Unknown error';
            setError(`Could not save: ${msg}`);
            handled = false;
          }
        }
      );
      controlsRef.current = controls;
    } catch {
      setError('Could not start camera.');
      setScanning(false);
    }
  };

  const flip = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startScan(next);
  };

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center">
        Scan the blank sticker on the container you're filling
      </p>
      {!scanning && (
        <button onClick={() => startScan()} className="w-full bg-green-600 text-white rounded-xl py-4 font-medium">
          📷 Start Scanning
        </button>
      )}
      {scanning && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-xl opacity-60" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={flip} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-sm font-medium">🔄 Flip</button>
            <button onClick={stop} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
      {conflict && (
        <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 text-center">
            This sticker is currently linked to <span className="font-semibold">{conflict.existingName}</span>. Replace it with <span className="font-semibold">{foodData.name}</span>?
          </p>
          <button
            onClick={async () => { await saveWithUuid(conflict.uuid); }}
            className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-medium"
          >
            Yes, replace
          </button>
          <button
            onClick={() => { setConflict(null); startScan(); }}
            className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm"
          >
            Scan a different sticker
          </button>
        </div>
      )}
      {error && (
        <div className="space-y-2">
          <p className="text-red-500 text-sm text-center">{error}</p>
          <button onClick={() => startScan()} className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm">Try Again</button>
        </div>
      )}
      {!conflict && <button onClick={onBack} className="w-full text-gray-400 text-sm py-2">← Back</button>}
    </div>
  );
}

function StickerSheetForm() {
  const [count, setCount] = useState(8);
  const [stickers, setStickers] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    const { default: QRCode } = await import('qrcode');
    const urls = await Promise.all(
      Array.from({ length: count }, async () => {
        const id = nanoid(8);
        const qrUrl = `${window.location.origin}/qr/${id}`;
        return QRCode.toDataURL(qrUrl, { width: 200, margin: 1, errorCorrectionLevel: 'L' });
      })
    );
    setStickers(urls);
    setGenerating(false);
  };

  const printSheet = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const cols = count === 1 ? 1 : count <= 4 ? 2 : 4;
    win.document.write(`<!DOCTYPE html><html><head><title>Fridge Stickers</title>
<style>
  body { margin: 0; padding: 8mm; font-family: sans-serif; background: white; }
  .grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 6mm; }
  .sticker { text-align: center; border: 1.5px dashed #aaa; border-radius: 4mm; padding: 3mm; page-break-inside: avoid; }
  img { width: 100%; display: block; }
  p { margin: 2mm 0 0; font-size: 8pt; color: #888; }
</style></head><body>
<div class="grid">
${stickers.map((url, i) => `<div class="sticker"><img src="${url}" /><p>Fridge sticker ${i + 1}</p></div>`).join('\n')}
</div>
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Generate a sheet of blank stickers to print and pre-stick on your Tupperware.
        When you put food in a container, open the Leftovers tab and scan the sticker to link them.
      </p>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">How many stickers?</p>
        <div className="flex gap-2">
          {[1, 4, 8, 12].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                count === n ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={generate}
        disabled={generating}
        className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
      >
        {generating ? 'Generating...' : `Generate ${count} Stickers`}
      </button>

      {stickers.length > 0 && (
        <div className="space-y-4">
          <div className={`grid gap-2 ${stickers.length === 1 ? 'grid-cols-1 max-w-[180px] mx-auto' : 'grid-cols-4'}`}>
            {stickers.map((url, i) => (
              <div key={i} className="border border-dashed border-gray-300 rounded-lg p-1">
                <img src={url} alt={`Sticker ${i + 1}`} className="w-full" />
              </div>
            ))}
          </div>
          <button
            onClick={printSheet}
            className="w-full bg-gray-800 text-white rounded-lg py-3 font-medium"
          >
            🖨️ Print Sheet
          </button>
          <button
            onClick={generate}
            className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 text-sm"
          >
            Regenerate
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
