import { useContext } from 'react';
import { PlayerCtx } from './PlayerContextInstance';

export const usePlayer = () => {
  const ctx = useContext(PlayerCtx);
  if (!ctx) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return ctx;
};
