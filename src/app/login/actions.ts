'use server';

import { PortalService } from '@/lib/portal/portal-service';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';

export async function login(formData: FormData, next: string) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // If there's a portal token, handle portal access
  const token = formData.get('token') as string;
  if (token) {
    try {
      const portalService = new PortalService();
      const portalLink = await portalService.validatePortalLink(token);
      if (portalLink) {
        // Create portal access
        await portalService.getOrCreatePortalAccess(
          data.user.id,
          portalLink.orgId,
          portalLink.contactId
        );

        // Update user's app_metadata to include org role
        const serviceClient = createServiceClient();
        await serviceClient.auth.admin.updateUserById(data.user.id, {
          app_metadata: {
            org_roles: {
              [portalLink.orgId]: 'portal_user',
            },
          },
        });

        await portalService.markLinkAsUsed(token);
      }
    } catch (error) {
      console.error('Failed to create portal access:', error);
      return { error: 'Failed to create portal access' };
    }
  }

  redirect(next);
}

export async function signup(formData: FormData, next: string) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const supabase = await createClient();

  // If there's a portal token, validate it first
  const token = formData.get('token') as string;
  let portalLink = null;
  if (token) {
    const portalService = new PortalService();
    portalLink = await portalService.validatePortalLink(token);
    if (!portalLink) {
      return { error: 'Invalid or expired portal link' };
    }
  }

  // Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If there's a portal link, create portal access
  if (portalLink && data.user) {
    try {
      // Add org role to user
      const serviceClient = createServiceClient();
      await serviceClient.auth.admin.updateUserById(data.user.id, {
        app_metadata: {
          org_roles: {
            [portalLink.orgId]: 'portal_user',
          },
        },
      });

      const portalService = new PortalService();
      await portalService.getOrCreatePortalAccess(
        data.user.id,
        portalLink.orgId,
        portalLink.contactId
      );
      await portalService.markLinkAsUsed(token);
    } catch (error) {
      console.error('Failed to create portal access:', error);
      return { error: 'Failed to create portal access' };
    }
  }

  redirect(next);
}
