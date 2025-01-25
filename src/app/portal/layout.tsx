import { ErrorBoundary } from '@/components/error-boundary';
import { getCurrentPortalUser } from '@/lib/auth/portal/session';
import { PortalHeader } from './_components/portal-header';
import { PortalMobileNav } from './_components/portal-mobile-nav';
import { PortalNav } from './_components/portal-nav';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userData = await getCurrentPortalUser();
  // Return children if no user data because redirect is handled by middleware
  if (!userData) return children;

  const { user, contact } = userData;

  return (
    <ErrorBoundary>
      <div className='flex min-h-screen'>
        {/* Desktop Sidebar */}
        <aside className='hidden w-[300px] flex-col border-r bg-background md:flex'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold'>Support Portal</h2>
          </div>
          <div className='flex-1'>
            <PortalNav />
          </div>
        </aside>

        {/* Main Content */}
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center md:hidden'>
            <PortalMobileNav />
          </div>
          <PortalHeader user={user} contact={contact} />

          {/* Page Content */}
          <main className='h-[calc(100vh-3.5rem)] overflow-y-auto p-6'>
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
