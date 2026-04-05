import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardScreen from './screens/DashboardScreen';
import AddItemScreen from './screens/AddItemScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import MealSuggestionsScreen from './screens/MealSuggestionsScreen';
import RestockScreen from './screens/RestockScreen';
import QrItemScreen from './screens/QrItemScreen';

export default function App() {
  return (
    <Routes>
      {/* Public QR route — no nav bar, works when opened from phone camera */}
      <Route path="/qr/:token" element={<QrItemScreen />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/add" element={<AddItemScreen />} />
        <Route path="/items/:id" element={<ItemDetailScreen />} />
        <Route path="/shopping" element={<ShoppingListScreen />} />
        <Route path="/meals" element={<MealSuggestionsScreen />} />
        <Route path="/restock" element={<RestockScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
