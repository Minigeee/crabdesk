import { ErrorBoundary } from '@/components/error-boundary';
import { Header } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { InternalAuthProvider } from '@/lib/auth/internal/provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InternalAuthProvider>
      <ErrorBoundary>
        <div className='flex min-h-screen'>
          {/* Desktop Sidebar */}
          <aside className='hidden w-64 flex-col border-r bg-background md:flex'>
            <div className='p-6'>
              <h2 className='text-lg font-semibold'>CrabDesk</h2>
            </div>
            <div className='flex-1 px-4'>
              <MainNav />
            </div>
          </aside>

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Main Content */}
          <div className='flex flex-1 flex-col'>
            <Header />

            {/* Page Content */}
            <main className='h-[calc(100vh-3.5rem)] overflow-y-auto'>
              {children}
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </InternalAuthProvider>
  );
}
