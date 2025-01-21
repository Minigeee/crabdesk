import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { useEffect, useState } from 'react';

type User = Database['public']['Tables']['users']['Row'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    async function fetchUser(userId: string) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      setUser(data);
      setLoading(false);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
