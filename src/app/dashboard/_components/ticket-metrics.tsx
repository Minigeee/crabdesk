'use client';

import { PriorityBadge } from '@/components/tickets/priority-badge';
import { StatusBadge } from '@/components/tickets/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/hooks';
import { DashboardService } from '@/lib/dashboard/dashboard-service';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Initialize supabase client
const supabase = createClient();

function TicketMetricsSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                <Skeleton className='h-4 w-[100px]' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className='h-7 w-16 mb-4' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-full' />
                <Skeleton className='h-5 w-full' />
                <Skeleton className='h-5 w-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className='h-6 w-[100px]' />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[350px]' />
        </CardContent>
      </Card>
    </div>
  );
}

export function TicketMetrics() {
  const { organization } = useAuth();

  const { data, isLoading, isPending } = useQuery({
    queryKey: ['dashboard-metrics', organization?.id],
    queryFn: async () => {
      if (!organization?.id) throw new Error('No organization ID');

      const dashboardService = new DashboardService(supabase, organization.id);
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
    },
    enabled: !!organization?.id,
  });

  const totalActive = useMemo(
    () => data?.statusMetrics.reduce((sum, { count }) => sum + count, 0) ?? 0,
    [data?.statusMetrics]
  );

  if (isLoading || isPending) {
    return <TicketMetricsSkeleton />;
  }

  if (!data) {
    return (
      <div className='flex h-[500px] w-full items-center justify-center'>
        <p className='text-lg text-muted-foreground'>Error loading dashboard data</p>
      </div>
    );
  }

  const { statusMetrics, priorityMetrics, assignmentMetrics, trendData } = data;

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalActive}</div>
            <div className='mt-4 space-y-2'>
              {statusMetrics.map(({ status, count }) => (
                <div
                  key={status}
                  className='flex items-center justify-between text-sm'
                >
                  <StatusBadge status={status} />
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>By Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>&nbsp;</div>
            <div className='mt-4 space-y-2'>
              {priorityMetrics.map(({ priority, count }) => (
                <div
                  key={priority}
                  className='flex items-center justify-between text-sm'
                >
                  <PriorityBadge priority={priority} />
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round(
                (assignmentMetrics.assigned /
                  (assignmentMetrics.assigned + assignmentMetrics.unassigned)) *
                  100
              )}
              % Assigned
            </div>
            <div className='mt-4 space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <StatusBadge status='open' />
                <span>{assignmentMetrics.assigned}</span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <StatusBadge status='pending' />
                <span>{assignmentMetrics.unassigned}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Get this data from database somehow */}
            <div className='text-2xl font-bold'>TODO</div>
            <p className='text-xs text-muted-foreground'>
              Average first response time
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[350px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={trendData}>
                <XAxis
                  dataKey='date'
                  stroke='#888888'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke='#888888'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#adfa1d'
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
