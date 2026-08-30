import { useContext } from 'react';
import { AuthCtx } from './AuthContextInstance';

export function useAuth() {
  const context = useContext(AuthCtx);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
