import { PortalService } from '@/lib/portal/portal-service';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth/common/supabase';

interface Props {
  searchParams: {
    token?: string;
  };
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = searchParams;

  // Redirect if no token provided
  if (!token) {
    redirect('/portal');
  }

  // Validate token
  const portalService = new PortalService();
  const portalLink = await portalService.validatePortalLink(token);

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

      // Redirect to ticket if provided, otherwise dashboard
      redirect(
        portalLink.ticketId
          ? `/portal/tickets/${portalLink.ticketId}`
          : "/portal/dashboard"
      );
    } catch (error) {
      console.error("Failed to create portal access:", error);
      redirect("/portal/error?code=access_error");
    }
  }

  // User is not logged in, redirect to login with return URL
  const returnUrl = portalLink.ticketId
    ? `/portal/tickets/${portalLink.ticketId}`
    : "/portal/dashboard";

  redirect(`/login?next=${encodeURIComponent(returnUrl)}&token=${token}`);
}
