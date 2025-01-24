import { useContext } from 'react';
import { InternalAuthContext } from '../common/types';
import { InternalAuthContext as Context } from './provider';

export function useInternalAuth(): InternalAuthContext {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useInternalAuth must be used within an InternalAuthProvider');
  }
  return context;
} 