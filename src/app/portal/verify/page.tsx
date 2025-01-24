import { getAuthUser } from '@/lib/auth/common/supabase';
import { PortalService } from '@/lib/portal/portal-service';
import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;

  // Redirect if no token provided
  if (!token) {
    redirect('/portal');
  }

  // Validate token
  const portalService = new PortalService();
  const portalLink = await portalService.validatePortalLink(token);
  console.log('portalLink', portalLink);

  // If invalid, redirect to error page
  if (!portalLink) {
    redirect('/portal/error?code=invalid_link');
  }

  // Check if user is already authenticated
  const user = await getAuthUser();
  if (user) {
    // User is logged in, try to get or create portal access
    try {
      await portalService.getOrCreatePortalAccess(
        user.id,
        portalLink.orgId,
        portalLink.contactId
      );

      // Mark link as used since we've processed it
      await portalService.markLinkAsUsed(token);
    } catch (error) {
      console.error('Failed to create portal access:', error);
      redirect('/portal/error?code=access_error');
    }

    // Redirect to ticket if provided, otherwise dashboard
    redirect(
      portalLink.ticketNumber !== undefined
        ? `/portal/tickets/${portalLink.ticketNumber}`
        : '/portal/dashboard'
    );
  }

  // User is not logged in, redirect to login with return URL
  const returnUrl = portalLink.ticketNumber
    ? `/portal/tickets/${portalLink.ticketNumber}`
    : '/portal/dashboard';

  redirect(`/login?next=${encodeURIComponent(returnUrl)}&token=${token}`);
}
