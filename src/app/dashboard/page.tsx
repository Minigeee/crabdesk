import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/auth/session';
import { DashboardService } from '@/lib/dashboard/dashboard-service';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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

async function getDashboardData() {
  const userData = await getCurrentUser();
  if (!userData) redirect('/login');

  const supabase = await createClient();
  const dashboardService = new DashboardService(
    supabase,
    userData.organization.id
  );

  const [statusMetrics, priorityMetrics, assignmentMetrics, trendData] =
    await Promise.all([
      dashboardService.getTicketStatusMetrics(),
      dashboardService.getTicketPriorityMetrics(),
      dashboardService.getTicketAssignmentMetrics(),
      dashboardService.getTicketTrend(),
    ]);

  return {
    statusMetrics,
    priorityMetrics,
    assignmentMetrics,
    trendData,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className='container space-y-8 p-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
      </div>

      <Suspense fallback={<TicketMetricsSkeleton />}>
        <TicketMetrics {...data} />
      </Suspense>
    </div>
  );
}
