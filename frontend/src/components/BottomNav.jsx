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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-2xl transition-all duration-300"
        style={{
          background: 'rgba(16, 18, 24, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.05)',
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
                flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs font-semibold
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.35)] border border-white'
                    : 'text-white/50 hover:text-white hover:bg-white/10 border border-transparent'
                }
              `}
            >
              <TabIcon size={15} strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
