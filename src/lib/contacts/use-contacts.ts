import { useAuth } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ContactService,
  type ContactInsert,
  type ContactSearchParams,
} from './contact-service';
import { searchContacts } from './actions';

export { type Contact } from './contact-service';

export function useContacts(params: ContactSearchParams = {}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => {
      if (!organization) throw new Error('Organization is required');
      return searchContacts(params);
    },
    enabled: !!organization,
  });
}

export function useContact(id: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      if (!organization) throw new Error('Organization is required');
      const supabase = createClient();
      const service = new ContactService(supabase, organization.id);
      const contact = await service.getContactById(id);
      if (!contact) throw new Error('Contact not found');
      return contact;
    },
    enabled: !!organization && !!id,
  });
}

export function useContactMutations() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const createContact = useMutation({
    mutationFn: async (contact: Omit<ContactInsert, 'org_id'>) => {
      if (!organization) throw new Error('Organization is required');
      const supabase = createClient();
      const service = new ContactService(supabase, organization.id);
      return service.createContact(contact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<ContactService['updateContact']>[1];
    }) => {
      if (!organization) throw new Error('Organization is required');
      const supabase = createClient();
      const service = new ContactService(supabase, organization.id);
      return service.updateContact(id, updates);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
    },
  });

  return {
    createContact,
    updateContact,
  };
}
