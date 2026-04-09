/**
 * BottomNav.jsx
 * Floating pill nav at the bottom centre of the main area.
 * Tabs: Home | Search | Library  (matching the screenshot icons)
 */
import { Home, Search, LayoutGrid } from 'lucide-react';

const TABS = [
  { key: 'home',    label: 'Home',    Icon: Home        },
  { key: 'search',  label: 'Search',  Icon: Search      },
  { key: 'library', label: 'Library', Icon: LayoutGrid  },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div className="flex justify-center">
      <nav
        className="flex items-center gap-1 px-2 py-2 rounded-full"
        style={{ background: 'rgba(20,12,30,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
      >
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              flex flex-col items-center gap-0.5 px-6 py-2 rounded-full text-xs
              transition-all duration-200
              ${active === key
                ? 'bg-white/15 text-white font-medium'
                : 'text-white/40 hover:text-white/65'}
            `}
          >
            <Icon size={17} strokeWidth={active === key ? 2 : 1.5} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
