import { useState } from 'react';
import { aiApi } from '../api/ai';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MealSuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiApi.getMeals();
      setSuggestions(data.suggestions);
      setFetched(true);
    } catch {
      setError('Could not get suggestions right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Meal Ideas</h1>
      <p className="text-gray-500 text-sm mb-6">Based on what's in your fridge right now</p>

      {!fetched && !loading && (
        <button
          onClick={fetchSuggestions}
          className="w-full bg-green-600 text-white rounded-xl py-4 font-medium text-lg"
        >
          🍳 What can I make?
        </button>
      )}

      {loading && <LoadingSpinner />}

      {error && <p className="text-red-500 text-center py-4">{error}</p>}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="bg-white rounded-xl px-4 py-4 shadow-sm">
              <p className="text-gray-800">{s}</p>
            </div>
          ))}
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="w-full text-green-600 text-sm font-medium py-2"
          >
            Refresh suggestions
          </button>
        </div>
      )}
    </div>
  );
}
