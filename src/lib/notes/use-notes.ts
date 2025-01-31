import { useAuth } from '@/lib/auth/hooks';
import { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type Note = Tables<'notes'> & {
  author?: {
    name: string;
  };
};

export type EntityType = 'contact' | 'ticket';

export function useNotes(entityType: EntityType, entityId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['notes', entityType, entityId];

  // Query for notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('notes')
        .select('*, author:users(name)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Mutation for adding notes
  const addNote = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');
      const supabase = createClient();
      const { error } = await supabase.from('notes').insert({
        entity_type: entityType,
        entity_id: entityId,
        content: content.trim(),
        author_id: user.id,
        org_id: user.org_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for deleting notes
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notes,
    isLoading,
    addNote,
    deleteNote,
  };
}
