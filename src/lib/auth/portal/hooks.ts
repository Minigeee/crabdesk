import { useContext } from 'react';
import type { PortalAuthContext } from '../common/types';
import { PortalAuthContext as Context } from './provider';

export function usePortalAuth(): PortalAuthContext {
  const context = useContext(Context);
  if (!context) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  }
  return context;
} 