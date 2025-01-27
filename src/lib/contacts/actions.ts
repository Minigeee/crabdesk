'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentUser } from '../auth/session';
import { ContactService, type ContactSearchParams } from './contact-service';

export async function searchContacts(params: ContactSearchParams) {
  const serviceClient = createServiceClient();

  const userData = await getCurrentUser();
  if (!userData) {
    throw new Error('Unauthorized');
  }

  // Use service client to bypass RLS for the actual search
  const service = new ContactService(serviceClient, userData.organization.id);
  const result = await service.searchContacts(params);

  return result;
}
