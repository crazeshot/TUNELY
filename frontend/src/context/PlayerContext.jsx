/**
 * PlayerContext.jsx
 * Global player state shared across all components.
 * Uses React Context + useReducer.
 *
 * Exposed via usePlayer() hook.
 */
import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { defaultTrack, initialQueue } from '../data/musicData';

const PlayerCtx = createContext(null);

const init = { currentTrack: defaultTrack, isPlaying: false, progress: 0, volume: 70, queue: initialQueue };

function reducer(s, a) {
  switch(a.type) {
    case 'TOGGLE':      return { ...s, isPlaying: !s.isPlaying };
    case 'PLAY':        return { ...s, currentTrack: a.track, isPlaying: true, progress: 0 };
    case 'PROGRESS':    return { ...s, progress: a.v };
    case 'VOLUME':      return { ...s, volume: a.v };
    case 'NEXT': {
      if (!s.queue.length) return s;
      const [next, ...rest] = s.queue;
      return { ...s, currentTrack: next, queue: rest, isPlaying: true, progress: 0 };
    }
    case 'PREV':        return { ...s, progress: 0 };
    case 'REMOVE':      return { ...s, queue: s.queue.filter(t => t.id !== a.id) };
    case 'ADD':         return s.queue.find(t=>t.id===a.track.id) ? s : { ...s, queue:[...s.queue,a.track] };
    default:            return s;
  }
}

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);
  const progRef = useRef(0);
  progRef.current = state.progress;
  const tickRef = useRef(null);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (state.isPlaying) {
      const dur = state.currentTrack?.durationSeconds || 243;
      tickRef.current = setInterval(() => {
        const next = Math.min(progRef.current + (100 / dur), 100);
        dispatch({ type: 'PROGRESS', v: next });
        if (next >= 100) clearInterval(tickRef.current);
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [state.isPlaying, state.currentTrack]);

  const api = {
    togglePlay:  ()  => dispatch({ type: 'TOGGLE' }),
    playTrack:   (t) => dispatch({ type: 'PLAY', track: t }),
    setProgress: (v) => dispatch({ type: 'PROGRESS', v }),
    setVolume:   (v) => dispatch({ type: 'VOLUME', v }),
    nextTrack:   ()  => dispatch({ type: 'NEXT' }),
    prevTrack:   ()  => dispatch({ type: 'PREV' }),
    removeQueue: (id)=> dispatch({ type: 'REMOVE', id }),
    addQueue:    (t) => dispatch({ type: 'ADD', track: t }),
  };

  return <PlayerCtx.Provider value={{ ...state, ...api }}>{children}</PlayerCtx.Provider>;
}

export const usePlayer = () => {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
};
