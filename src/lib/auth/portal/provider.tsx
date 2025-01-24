'use client';

import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { createContext, useEffect, useState } from 'react';
import type { PortalAuthContext as PortalAuthContextType } from '../common/types';

type PortalUser = Tables<'portal_users'>;
type Contact = Tables<'contacts'>;

export const PortalAuthContext = createContext<PortalAuthContextType>({
  user: null,
  contact: null,
  isLoading: true,
  error: null,
});

export function PortalAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setContact(null);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get portal user data
        const { data: userData, error: userError } = await supabase
          .from('portal_users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (userError) throw userError;
        if (!userData) throw new Error('Portal user not found');

        setUser(userData);

        // Get contact data
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('portal_user_id', userData.id)
          .single();

        if (contactError) throw contactError;
        if (!contactData) throw new Error('Contact not found');

        setContact(contactData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load user data'));
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <PortalAuthContext.Provider
      value={{
        user,
        contact,
        isLoading,
        error,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
} 