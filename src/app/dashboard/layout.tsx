import { MainNav } from '@/components/layout/main-nav'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Header } from '@/components/layout/header'
import { OrganizationProvider } from '@/components/providers/organization-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrganizationProvider>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-background">
          <div className="p-6">
            <h2 className="text-lg font-semibold">CrabDesk</h2>
          </div>
          <div className="flex-1 px-4">
            <MainNav />
          </div>
        </aside>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </OrganizationProvider>
  )
} 