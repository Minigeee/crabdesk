'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { type TicketWithDetails } from '@/lib/types/ticket';
import { updateTicket } from '../actions';

const customerTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
});

const agentTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().optional(),
  team_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  internal_notes: z.string().optional(),
});

type CustomerTicketSchema = z.infer<typeof customerTicketSchema>;
type AgentTicketSchema = z.infer<typeof agentTicketSchema>;

interface TicketMetadata {
  internal_notes?: string;
  [key: string]: unknown;
}

interface TicketEditFormProps {
  ticket: TicketWithDetails;
  userRole: 'customer' | 'agent' | 'admin';
  teams?: { id: string; name: string }[];
  agents?: { id: string; full_name: string }[];
}

export function TicketEditForm({
  ticket,
  userRole,
  teams = [],
  agents = [],
}: TicketEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAgent = userRole === 'agent' || userRole === 'admin';
  const schema = isAgent ? agentTicketSchema : customerTicketSchema;

  const form = useForm<CustomerTicketSchema | AgentTicketSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: ticket.title,
      description: ticket.description,
      ...(isAgent && {
        status: ticket.status,
        priority: ticket.priority,
        assigned_to: ticket.assigned_to ?? undefined,
        team_id: ticket.team_id ?? undefined,
        tags: ticket.tags || undefined,
        internal_notes:
          (ticket.metadata as TicketMetadata)?.internal_notes || undefined,
      }),
    },
  });

  function onSubmit(data: CustomerTicketSchema | AgentTicketSchema) {
    startTransition(async () => {
      try {
        // Move internal_notes to metadata
        const ticketData: any = {
          ...data,
          metadata: {
            ...(ticket.metadata as TicketMetadata),
            internal_notes: (data as AgentTicketSchema).internal_notes,
          },
        };
        delete ticketData.internal_notes;

        const result = await updateTicket(ticket.id, ticketData);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast({
          title: 'Success',
          description: 'Ticket updated successfully',
        });
        router.push(`/app/tickets/${ticket.id}`);
        router.refresh();
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to update ticket',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem className='space-y-2'>
              <div>
                <FormLabel required>Title</FormLabel>
                <FormDescription>
                  A clear and concise title helps us understand your issue
                  quickly
                </FormDescription>
              </div>
              <FormControl>
                <Input placeholder='Brief summary of the issue' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem className='space-y-2'>
              <div>
                <FormLabel required>Description</FormLabel>
                <FormDescription>
                  Include any relevant details that could help resolve your
                  issue
                </FormDescription>
              </div>
              <FormControl>
                <Textarea
                  placeholder='Please provide detailed information about your issue'
                  className='min-h-[150px] resize-y'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isAgent && (
          <div className='space-y-8'>
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <div>
                    <FormLabel required>Status</FormLabel>
                    <FormDescription>
                      Update the current status of the ticket
                    </FormDescription>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='open'>Open</SelectItem>
                      <SelectItem value='in_progress'>In Progress</SelectItem>
                      <SelectItem value='resolved'>Resolved</SelectItem>
                      <SelectItem value='closed'>Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='priority'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <div>
                    <FormLabel required>Priority</FormLabel>
                    <FormDescription>
                      Set the urgency level of this ticket
                    </FormDescription>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select priority level' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='low'>Low</SelectItem>
                      <SelectItem value='medium'>Medium</SelectItem>
                      <SelectItem value='high'>High</SelectItem>
                      <SelectItem value='urgent'>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='assigned_to'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <div>
                    <FormLabel>Assign To</FormLabel>
                    <FormDescription>
                      Assign this ticket to a specific agent
                    </FormDescription>
                  </div>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger
                        clearable
                        onClear={() => field.onChange('')}
                        value={field.value}
                      >
                        <SelectValue placeholder='Select an agent' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='team_id'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <div>
                    <FormLabel>Team</FormLabel>
                    <FormDescription>
                      Assign this ticket to a team
                    </FormDescription>
                  </div>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger
                        clearable
                        onClear={() => field.onChange('')}
                        value={field.value}
                      >
                        <SelectValue placeholder='Select a team' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='internal_notes'
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <div>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormDescription>
                      These notes are only visible to agents
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder='Add any internal notes or comments'
                      className='min-h-[100px] resize-y'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className='flex gap-4 pt-4'>
          <Button
            type='submit'
            className='w-full sm:w-auto'
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type='button'
            variant='outline'
            className='w-full sm:w-auto'
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
