import { Home, Search, LayoutGrid } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';

const TABS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'search', label: 'Search', icon: Search },
  { key: 'library', label: 'Library', icon: LayoutGrid },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = usePlayer();

  return (
    <div className="flex justify-center">
      <nav
        className="flex items-center gap-1.5 px-3 py-2 rounded-full shadow-2xl"
        style={{
          background: 'rgba(20, 10, 30, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {TABS.map((tabItem) => {
          const TabIcon = tabItem.icon;
          const isActive = activeTab === tabItem.key;
          return (
            <button
              key={tabItem.key}
              onClick={() => setActiveTab(tabItem.key)}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium
                transition-all duration-300
                ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-600/30 border border-pink-500/40 text-white shadow-md'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <TabIcon size={16} strokeWidth={isActive ? 2.2 : 1.6} />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
