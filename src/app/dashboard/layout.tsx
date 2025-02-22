import { ErrorBoundary } from '@/components/error-boundary';
import { Header } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Anchor } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className='flex min-h-screen'>
        {/* Desktop Sidebar */}
        <aside className='hidden w-64 flex-col border-r bg-background md:flex'>
          {/* Logo Section */}
          <div className='p-6'>
            <Link href='/' className='flex items-center'>
              <Anchor className='stroke-3 mr-2 h-6 w-6 animate-[wave_4s_ease-in-out_infinite] text-primary' />
              <h1 className='bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent'>
                CrabDesk
              </h1>
            </Link>
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
  );
}
