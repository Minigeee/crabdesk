'use client';

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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createTicket } from './actions';

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  customer_id: z.string().min(1, 'Customer is required').optional(),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof ticketSchema>;

type Customer = {
  id: string;
  full_name: string;
  email: string;
};

export function CreateTicketForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAgent, setIsAgent] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      customer_id: undefined,
      tags: [],
    },
  });

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // Get current user and their role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', user.id)
          .single();

        if (userData) {
          setCurrentUser(userData);
          setIsAgent(userData.role === 'agent' || userData.role === 'admin');

          // If user is a customer, set their ID as customer_id
          if (userData.role === 'customer') {
            form.setValue('customer_id', userData.id);
          }
        }
      }

      // If user is an agent/admin, fetch customer list
      if (isAgent) {
        const { data: customerData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'customer');

        if (customerData) {
          setCustomers(customerData);
        }
      }
    }

    init();
  }, [form, isAgent]);

  async function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await createTicket({
        ...data,
        customer_id: data.customer_id ?? currentUser?.id ?? '',
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Ticket created successfully.',
      });
      router.push('/tickets');
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        {isAgent && (
          <FormField
            control={form.control}
            name='customer_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
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
                <FormDescription>
                  Select the customer this ticket is for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder='Brief summary of the issue' {...field} />
              </FormControl>
              <FormDescription>
                A clear and concise title helps us route your ticket to the
                right team.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Please provide detailed information about your issue'
                  className='min-h-[150px]'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include any relevant details that will help us understand and
                resolve your issue.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='priority'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
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
              <FormDescription>
                Choose a priority level based on the urgency of your issue.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create Ticket
          </Button>
        </div>
      </form>
    </Form>
  );
}
