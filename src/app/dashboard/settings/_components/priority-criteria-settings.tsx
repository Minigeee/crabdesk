'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/hooks';
import type {
  OrganizationSettings,
  PriorityCriteria,
} from '@/lib/settings/types';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  urgent: z.string().min(1),
  high: z.string().min(1),
  normal: z.string().min(1),
  low: z.string().min(1),
});

interface PriorityCriteriaSettingsProps {
  initialSettings?: PriorityCriteria;
}

const DEFAULT_CRITERIA: PriorityCriteria = {
  urgent:
    'System failures or issues that: (1) affect medical equipment or life-critical systems, (2) cause complete loss of power during emergencies, (3) create immediate safety risks, or (4) leave essential equipment without backup power',
  high: 'Issues involving: (1) commercial/enterprise-wide impacts, (2) physical system damage, (3) performance degradation >25%, (4) multi-site system failures, (5) complete monitoring/control loss for business customers, or (6) warranty claims for major system defects',
  normal:
    'Standard requests including: (1) sales inquiries, (2) feature upgrades, (3) individual residential support, (4) non-critical software issues, or (5) general information requests without immediate impact',
  low: 'Minor requests including: (1) general feedback, (2) documentation requests, (3) feature suggestions, or (4) inquiries without current system impact',
};

async function updatePriorityCriteria(
  criteria: PriorityCriteria,
  orgId: string
) {
  const supabase = createClient();
  const { data: current } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  const currentSettings = (current?.settings || {}) as OrganizationSettings;
  const updatedSettings = {
    ...currentSettings,
    priorityCriteria: criteria,
  };

  const { error } = await supabase
    .from('organizations')
    .update({ settings: updatedSettings as any })
    .eq('id', orgId)
    .single();

  if (error) throw error;
  return { success: true };
}

export function PriorityCriteriaSettings({
  initialSettings,
}: PriorityCriteriaSettingsProps) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ['settings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      const supabase = createClient();
      const { data } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single();
      return data?.settings as OrganizationSettings;
    },
    enabled: !!organization?.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...DEFAULT_CRITERIA,
      ...initialSettings,
      ...settings?.priorityCriteria,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PriorityCriteria) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      return updatePriorityCriteria(values, organization.id);
    },
    onSuccess: () => {
      if (organization?.id) {
        queryClient.invalidateQueries({
          queryKey: ['settings', organization.id],
        });
      }
      toast({
        title: 'Settings saved',
        description: 'Priority criteria have been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to save priority criteria:', error);
      toast({
        title: 'Error',
        description: 'Failed to save priority criteria. Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (!organization) {
    return null;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Priority Criteria</CardTitle>
        <CardDescription>
          Define criteria for automatically assigning priority levels to
          incoming tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <Tabs defaultValue='urgent' className='w-full'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='urgent'>Urgent</TabsTrigger>
                <TabsTrigger value='high'>High</TabsTrigger>
                <TabsTrigger value='normal'>Normal</TabsTrigger>
                <TabsTrigger value='low'>Low</TabsTrigger>
              </TabsList>

              {(['urgent', 'high', 'normal', 'low'] as const).map(
                (priority) => (
                  <TabsContent
                    key={priority}
                    value={priority}
                    className='space-y-4'
                  >
                    <FormField
                      control={form.control}
                      name={priority}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Criteria</FormLabel>
                          <FormDescription>
                            Describe in natural language what makes a ticket{' '}
                            {priority} priority
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder={`Describe what constitutes ${priority} priority tickets...`}
                              className='min-h-[200px]'
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                )
              )}
            </Tabs>

            <Button type='submit' disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
