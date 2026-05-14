import { useState } from 'react';
import { Home, Package, UtensilsCrossed, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { AppProvider } from './contexts/AppContext';
import HomeTab from './pages/Home';
import IngredientsTab from './pages/Ingredients';
import MealsTab from './pages/Meals';
import StatsTab from './pages/Stats';
import SettingsPage from './pages/Settings';
import Modal from './components/Modal';

type Tab = 'home' | 'ingredients' | 'meals' | 'stats';

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'home', label: '홈', Icon: Home },
  { id: 'ingredients', label: '식재료', Icon: Package },
  { id: 'meals', label: '식사기록', Icon: UtensilsCrossed },
  { id: 'stats', label: '통계', Icon: BarChart2 },
];

function AppInner() {
  const [tab, setTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-receipt-bg flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-receipt-border px-4 pt-safe-top sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="한끼 영수증" className="w-8 h-8 object-contain" />
            <div>
              <span className="font-bold text-gray-800 text-lg">한끼 영수증</span>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
            aria-label="설정"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-4">
          {tab === 'home' && <HomeTab onNavigate={(t) => setTab(t as Tab)} />}
          {tab === 'ingredients' && <IngredientsTab />}
          {tab === 'meals' && <MealsTab />}
          {tab === 'stats' && <StatsTab />}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="bg-white border-t border-receipt-border sticky bottom-0 pb-safe z-30">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
                tab === id ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} className={tab === id ? 'text-brand-500' : ''} />
              <span className={`text-xs font-medium ${tab === id ? 'text-brand-500' : ''}`}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="설정"
        size="md"
      >
        <SettingsPage />
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
