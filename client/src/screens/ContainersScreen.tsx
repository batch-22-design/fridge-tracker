import { useState, useRef, useEffect } from 'react';
import { containersApi, type Container } from '../api/containers';

type View = 'list' | 'add-scan' | 'add-photo';

function resizeImage(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

export default function ContainersScreen() {
  const [view, setView] = useState<View>('list');
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingToken, setPendingToken] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await containersApi.list();
    setContainers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (view === 'add-scan') {
    return (
      <ScanStep
        onScanned={(token) => { setPendingToken(token); setView('add-photo'); }}
        onBack={() => setView('list')}
      />
    );
  }

  if (view === 'add-photo') {
    const existing = containers.find((c) => c.qr_token === pendingToken);
    return (
      <PhotoStep
        token={pendingToken}
        existing={existing}
        onSaved={() => { load(); setView('list'); }}
        onBack={() => setView('add-scan')}
      />
    );
  }

  if (editingId !== null) {
    const container = containers.find((c) => c.id === editingId)!;
    return (
      <PhotoStep
        token={container.qr_token}
        existing={container}
        onSaved={() => { load(); setEditingId(null); }}
        onBack={() => setEditingId(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Containers</h1>
        <button
          onClick={() => setView('add-scan')}
          className="bg-green-600 text-white text-sm rounded-full px-4 py-1.5 font-medium"
        >
          + Add
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Loading...</p>
      ) : containers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🫙</p>
          <p className="mb-1">No containers yet</p>
          <p className="text-sm">Scan a QR sticker on a Tupperware to add it</p>
          <button onClick={() => setView('add-scan')} className="mt-4 text-green-600 text-sm font-medium">
            Add a container
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {containers.map((c) => (
            <button
              key={c.id}
              onClick={() => setEditingId(c.id)}
              className="bg-white rounded-2xl shadow-sm overflow-hidden text-left"
            >
              {c.photo ? (
                <img src={c.photo} alt={c.name ?? 'Container'} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-4xl">🫙</div>
              )}
              <div className="p-2">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name ?? 'Unnamed container'}</p>
                {c.current_food ? (
                  <p className="text-xs text-green-700 truncate">{c.current_food}</p>
                ) : (
                  <p className="text-xs text-gray-400">Empty</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanStep({ onScanned, onBack }: { onScanned: (token: string) => void; onBack: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  const startScan = async (facing = facingMode) => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(true);
    setError('');
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
          const match = result.getText().match(UUID_RE);
          if (!match) { setError("That doesn't look like a fridge sticker."); handled = false; return; }
          onScanned(match[0]);
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

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-green-600 text-sm mb-2">← Back</button>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Scan sticker on container</h1>

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
            <button onClick={() => { controlsRef.current?.stop(); setScanning(false); }} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}

function PhotoStep({
  token,
  existing,
  onSaved,
  onBack,
}: {
  token: string;
  existing?: Container;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [photo, setPhoto] = useState(existing?.photo ?? '');
  const [saving, setSaving] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setPhoto(resized);
  };

  const save = async () => {
    setSaving(true);
    await containersApi.save({ qr_token: token, name: name || undefined, photo: photo || undefined });
    onSaved();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-green-600 text-sm">← Back</button>
      <h1 className="text-xl font-bold text-gray-900">{existing ? 'Edit container' : 'Add container photo'}</h1>

      <label className="block cursor-pointer">
        {photo ? (
          <img src={photo} alt="Container" className="w-full aspect-square object-cover rounded-2xl" />
        ) : (
          <div className="w-full aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-5xl">📷</span>
            <span className="text-sm">Tap to take or choose a photo</span>
          </div>
        )}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. Large blue Tupperware"
        />
      </div>

      <button
        onClick={save}
        disabled={saving || !photo}
        className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save container'}
      </button>
      {!photo && <p className="text-xs text-gray-400 text-center">Add a photo to save</p>}
    </div>
  );
}
