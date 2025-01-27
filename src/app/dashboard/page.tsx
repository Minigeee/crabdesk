import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { TicketMetrics } from './_components/ticket-metrics';

function TicketMetricsSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-32' />
        ))}
      </div>
      <Skeleton className='h-[350px]' />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className='container space-y-8 p-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
      </div>

      <Suspense fallback={<TicketMetricsSkeleton />}>
        <TicketMetrics />
      </Suspense>
    </div>
  );
}
