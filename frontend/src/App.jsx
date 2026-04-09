/**
 * App.jsx
 * Root layout with:
 *  - LiquidEther animated background layer
 *  - Three-column flex layout: Sidebar | MainContent | RightPanel
 *  - PlayerProvider wraps everything for shared state
 */
import { useState } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import Sidebar     from './components/Sidebar';
import MainContent from './components/MainContent';
import RightPanel  from './components/RightPanel';
import LiquidEther from './LiquidEther';

export default function App() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <PlayerProvider>
      <div className="relative w-full h-full overflow-hidden" style={{ background: '#120818' }}>

        <div className="absolute inset-0 z-0 pointer-events-none">
          <div style={{ width: '100%', height: '100rem', position: 'relative' }}>
            <LiquidEther
              colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
              mouseForce={20}
              cursorSize={100}
              isViscous
              viscous={30}
              iterationsViscous={32}
              iterationsPoisson={32}
              resolution={0.5}
              isBounce={false}
              autoDemo
              autoSpeed={0.5}
              autoIntensity={2.2}
              takeoverDuration={0.25}
              autoResumeDelay={3000}
              autoRampDuration={0.6}
              color0="#5227FF"
              color1="#8a3d88"
              color2="#e7239f"
            />
          </div>
        </div>

        {/* ── Main 3-column layout ── */}
        <div className="relative z-10 flex h-full gap-2 p-3">
          <Sidebar
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed(v => !v)}
          />
          <MainContent />
          <RightPanel
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed(v => !v)}
          />
        </div>

        {/* Inject keyframe for card entrance */}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </PlayerProvider>
  );
}
