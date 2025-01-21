import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketService } from '@/lib/services/ticket.service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const PRIORITY_COLORS = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-yellow-500',
  urgent: 'bg-red-500',
} as const;

const STATUS_COLORS = {
  open: 'bg-green-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-gray-500',
  closed: 'bg-gray-700',
} as const;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TicketDetailPage({ params }: PageProps) {
  const ticketService = await TicketService.create();
  const ticket = await ticketService.getById(params.id);

  if (!ticket) {
    notFound();
  }

  return (
    <div className='flex min-h-full flex-col'>
      {/* Header */}
      <header className='border-b bg-background'>
        <div className='flex h-14 items-center gap-4 px-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/app/tickets'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='flex flex-1 items-center justify-between'>
            <h1 className='text-lg font-semibold'>Ticket Details</h1>
            <Button variant='outline' size='sm' asChild>
              <Link href={`/app/tickets/${ticket.id}/edit`}>
                <Pencil className='mr-2 h-4 w-4' />
                Edit Ticket
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className='flex flex-1'>
        {/* Sidebar */}
        <div className='w-80 border-r bg-muted/10'>
          <div className='space-y-6 p-6'>
            {/* Title */}
            <div>
              <h2 className='text-lg font-semibold'>{ticket.title}</h2>
              <h1 className='text-xs text-muted-foreground'>{ticket.id}</h1>
            </div>

            {/* Status and Priority */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Badge
                  className={cn(
                    'w-full justify-center',
                    STATUS_COLORS[ticket.status],
                  )}
                >
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className='space-y-2'>
                <Label>Priority</Label>
                <Badge
                  className={cn(
                    'w-full justify-center',
                    PRIORITY_COLORS[ticket.priority],
                  )}
                >
                  {ticket.priority}
                </Badge>
              </div>
            </div>

            {/* Assignment */}
            <div className='space-y-2'>
              <Label>Assignment</Label>
              <div className='rounded-lg border bg-background px-4 py-3'>
                <div className='space-y-2'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Assigned To</p>
                    <p className='text-sm font-medium'>
                      {ticket.assignee?.full_name || 'Unassigned'}
                    </p>
                  </div>
                  {ticket.team_id && (
                    <div>
                      <p className='text-sm text-muted-foreground'>Team</p>
                      <p className='text-sm font-medium'>
                        {ticket.team?.name || 'Unknown Team'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className='space-y-2'>
              <Label>Customer</Label>
              <div className='rounded-lg border bg-background px-4 py-3'>
                <div className='space-y-1'>
                  <p className='text-sm font-semibold'>
                    {ticket.customer?.full_name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {ticket.customer?.email}
                  </p>
                  {ticket.organization_id && (
                    <p className='text-xs text-muted-foreground'>
                      {ticket.organization?.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className='space-y-2'>
                <Label>Tags</Label>
                <div className='flex flex-wrap gap-2'>
                  {ticket.tags.map((tag) => (
                    <Badge key={tag} variant='secondary'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className='space-y-2'>
              <Label>Details</Label>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Created</span>
                  <span>
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Updated</span>
                  <span>
                    {formatDistanceToNow(new Date(ticket.updated_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {ticket.due_date && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Due</span>
                    <span>
                      {formatDistanceToNow(new Date(ticket.due_date), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 p-4'>
          <Tabs defaultValue='details' className='h-full'>
            <TabsList>
              <TabsTrigger value='details'>Details</TabsTrigger>
              <TabsTrigger value='conversations'>Conversations</TabsTrigger>
              <TabsTrigger value='activity'>Activity</TabsTrigger>
            </TabsList>
            <div className='p-4'>
              <TabsContent value='details' className='mt-0'>
                <div className='space-y-6'>
                  {/* Description */}
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-medium'>Description</h3>
                      <Button variant='ghost' size='sm'>
                        <Pencil className='mr-2 h-4 w-4' />
                        Edit
                      </Button>
                    </div>
                    <div className='rounded-lg border bg-muted/10 p-4'>
                      <p className='whitespace-pre-wrap'>
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='conversations' className='mt-0'>
                {/* Conversations will be added here */}
                <div className='rounded-lg border p-4'>
                  <p className='text-center text-muted-foreground'>
                    Conversations feature coming soon
                  </p>
                </div>
              </TabsContent>
              <TabsContent value='activity' className='mt-0'>
                {/* Activity log will be added here */}
                <div className='rounded-lg border p-4'>
                  <p className='text-center text-muted-foreground'>
                    Activity log feature coming soon
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
