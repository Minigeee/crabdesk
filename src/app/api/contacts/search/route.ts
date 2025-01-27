import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentUser } from '@/lib/auth/session';
import { ContactService, type ContactSearchParams } from '@/lib/contacts/contact-service';

export async function POST(request: Request) {
  try {
    // Get current user
    const userData = await getCurrentUser();
    if (!userData) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search params from request body
    const params: ContactSearchParams = await request.json();

    // Use service client to bypass RLS for the actual search
    const serviceClient = createServiceClient();
    const service = new ContactService(serviceClient, userData.organization.id);
    const result = await service.searchContacts(params);

    return Response.json(result);
  } catch (error) {
    console.error('Error searching contacts:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 