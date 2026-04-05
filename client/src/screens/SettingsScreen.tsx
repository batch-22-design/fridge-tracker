import { useNavigate } from 'react-router-dom';

export default function SettingsScreen() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-2">
        <button
          onClick={() => navigate('/containers')}
          className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🫙</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Tubs</p>
              <p className="text-xs text-gray-500">Manage your containers and QR stickers</p>
            </div>
          </div>
          <span className="text-gray-400">›</span>
        </button>
      </div>
    </div>
  );
}
