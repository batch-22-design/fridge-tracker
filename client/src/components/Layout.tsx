import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full px-4 pt-4">
        <Outlet />
      </main>

      {/* Bottom nav — mobile first */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
        <NavLink to="/dashboard" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`
        }>
          <span className="text-xl">🧊</span>
          <span>Fridge</span>
        </NavLink>
        <NavLink to="/add" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`
        }>
          <span className="text-xl">➕</span>
          <span>Add</span>
        </NavLink>
        <NavLink to="/shopping" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`
        }>
          <span className="text-xl">🛒</span>
          <span>Shopping</span>
        </NavLink>
        <NavLink to="/meals" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`
        }>
          <span className="text-xl">🍳</span>
          <span>Meals</span>
        </NavLink>
        <NavLink to="/containers" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`
        }>
          <span className="text-xl">📦</span>
          <span>Containers</span>
        </NavLink>
      </nav>
    </div>
  );
}
