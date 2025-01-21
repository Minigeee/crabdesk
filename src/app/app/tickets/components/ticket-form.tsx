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
import { createTicket } from '../actions';

const customerTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

const agentTicketSchema = customerTicketSchema.extend({
  customer_id: z.string().min(1, 'Customer is required'),
  assigned_to: z.string().optional(),
  team_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  internal_notes: z.string().optional(),
});

type CustomerTicketSchema = z.infer<typeof customerTicketSchema>;
type AgentTicketSchema = z.infer<typeof agentTicketSchema>;

interface TicketFormProps {
  userRole: 'customer' | 'agent' | 'admin';
  teams?: { id: string; name: string }[];
  agents?: { id: string; full_name: string }[];
  customers?: { id: string; full_name: string; email: string }[];
}

export function TicketForm({
  userRole,
  teams = [],
  agents = [],
  customers = [],
}: TicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAgent = userRole === 'agent' || userRole === 'admin';
  const schema = isAgent ? agentTicketSchema : customerTicketSchema;

  const form = useForm<CustomerTicketSchema | AgentTicketSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      ...(isAgent && {
        customer_id: '',
        assigned_to: '',
        team_id: '',
        tags: [],
        internal_notes: '',
      }),
    },
  });

  function onSubmit(data: CustomerTicketSchema | AgentTicketSchema) {
    startTransition(async () => {
      try {
        await createTicket(data);
        toast({
          title: 'Success',
          description: 'Ticket created successfully',
        });
        router.push('/app/tickets');
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to create ticket. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {isAgent && (
          <FormField
            control={form.control}
            name='customer_id'
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <div>
                  <FormLabel required>Customer</FormLabel>
                  <FormDescription>
                    Select the customer this ticket is for
                  </FormDescription>
                </div>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a customer' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        <FormField
          control={form.control}
          name='priority'
          render={({ field }) => (
            <FormItem className='space-y-2'>
              <div>
                <FormLabel required>Priority</FormLabel>
                <FormDescription>
                  Choose the urgency level of your issue
                </FormDescription>
              </div>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        {isAgent && (
          <div className='space-y-8'>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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

        <div className='pt-4'>
          <Button
            type='submit'
            className='w-full sm:w-auto'
            disabled={isPending}
          >
            {isPending ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
