import { LoadingState } from '@/components/ui/loading-state'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="p-6">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 px-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-muted rounded animate-pulse"
              style={{
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <header className="h-14 border-b px-4 flex items-center">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </header>

        {/* Content Loading State */}
        <main className="flex-1 p-6">
          <LoadingState size="lg" />
        </main>
      </div>
    </div>
  )
} 