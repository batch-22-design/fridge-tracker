import { useState } from 'react';
import { aiApi, type RestockPrediction } from '../api/ai';
import LoadingSpinner from '../components/LoadingSpinner';

const confidenceLabel = {
  high: { label: 'High', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', className: 'bg-gray-100 text-gray-500' },
};

export default function RestockScreen() {
  const [predictions, setPredictions] = useState<RestockPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiApi.getRestock();
      setPredictions(data.predictions);
      setFetched(true);
    } catch {
      setError('Could not get predictions right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Restock Predictions</h1>
      <p className="text-gray-500 text-sm mb-6">Items likely to run out based on your usage history</p>

      {!fetched && !loading && (
        <button onClick={fetchPredictions} className="w-full bg-green-600 text-white rounded-xl py-4 font-medium text-lg">
          📦 Check restock needs
        </button>
      )}

      {loading && <LoadingSpinner />}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {predictions.length > 0 && (
        <div className="space-y-3">
          {predictions.map((p, i) => {
            const conf = confidenceLabel[p.confidence];
            return (
              <div key={i} className="bg-white rounded-xl px-4 py-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-sm text-gray-500">~{p.estimatedDaysUntilEmpty} days left</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${conf.className}`}>
                  {conf.label}
                </span>
              </div>
            );
          })}
          <button onClick={fetchPredictions} disabled={loading} className="w-full text-green-600 text-sm font-medium py-2">
            Refresh
          </button>
        </div>
      )}

      {fetched && predictions.length === 0 && (
        <p className="text-center py-8 text-gray-400">No predictions yet — use the app for a few days first</p>
      )}
    </div>
  );
}
