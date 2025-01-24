'use client';

import { PriorityBadge } from '@/components/tickets/priority-badge';
import { StatusBadge } from '@/components/tickets/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  TicketAssignmentMetrics,
  TicketPriorityMetrics,
  TicketStatusMetrics,
  TicketTrendPoint,
} from '@/lib/dashboard/dashboard-service';
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

type TicketMetricsProps = {
  statusMetrics: TicketStatusMetrics[];
  priorityMetrics: TicketPriorityMetrics[];
  assignmentMetrics: TicketAssignmentMetrics;
  trendData: TicketTrendPoint[];
};

export function TicketMetrics({
  statusMetrics,
  priorityMetrics,
  assignmentMetrics,
  trendData,
}: TicketMetricsProps) {
  const totalActive = useMemo(
    () => statusMetrics.reduce((sum, { count }) => sum + count, 0),
    [statusMetrics]
  );

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
            <div className='text-2xl font-bold'>1.2h</div>
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
