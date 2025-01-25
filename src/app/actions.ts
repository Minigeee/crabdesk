'use server';

import { requireInternalUser } from '@/lib/auth/internal/session';
import { PortalService } from '@/lib/portal/portal-service';

type GeneratePortalLinkResult =
  | { link: string; error?: never }
  | { link?: never; error: string };

export async function generatePortalLink(
  contactId: string,
  ticketId?: string | null
): Promise<GeneratePortalLinkResult> {
  try {
    // Ensure user is authenticated and has access
    await requireInternalUser();

    const portalService = new PortalService();
    const link = await portalService.generatePortalLink(
      contactId,
      ticketId || undefined
    );
    console.log('Generated link:', link, contactId, ticketId);

    return { link };
  } catch (error) {
    console.error('Failed to generate portal link:', error);
    return { error: 'Failed to generate portal link' };
  }
}
