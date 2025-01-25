import { LoadingState } from '@/components/ui/loading-state';

export default function DashboardLoading() {
  return (
    <div className='flex min-h-screen'>
      {/* Sidebar Skeleton */}
      <aside className='hidden w-64 flex-col border-r bg-background md:flex'>
        <div className='p-6'>
          <div className='h-6 w-24 animate-pulse rounded bg-muted' />
        </div>
        <div className='flex-1 space-y-2 px-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='h-10 animate-pulse rounded bg-muted'
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex flex-1 flex-col'>
        {/* Header Skeleton */}
        <header className='flex h-14 items-center border-b px-4'>
          <div className='h-4 w-32 animate-pulse rounded bg-muted' />
        </header>

        {/* Content Loading State */}
        <main className='flex-1 p-6'>
          <LoadingState size='lg' />
        </main>
      </div>
    </div>
  );
}
