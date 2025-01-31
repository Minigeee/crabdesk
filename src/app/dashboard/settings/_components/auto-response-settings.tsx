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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/hooks';
import type {
  AutoResponseSettings,
  OrganizationSettings,
} from '@/lib/settings/types';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  enabled: z.boolean(),
  tone: z.string().min(1),
  language: z.string().min(1),
  responseGuidelines: z.string().min(1),
  complianceRequirements: z.string().min(1),
});

interface AutoResponseSettingsProps {
  initialSettings?: AutoResponseSettings;
}

const DEFAULT_SETTINGS: AutoResponseSettings = {
  enabled: true,
  tone: 'Professional and friendly',
  language: 'English',
  responseGuidelines:
    'Begin with a greeting, acknowledge the issue, provide clear next steps or solutions, and end with a professional closing.',
  complianceRequirements:
    'Include data privacy disclaimer when discussing sensitive information. Never share customer data or internal system details.',
};

async function updateAutoResponseSettings(
  settings: AutoResponseSettings,
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
    autoResponse: settings,
  };

  const { error } = await supabase
    .from('organizations')
    .update({ settings: updatedSettings as any })
    .eq('id', orgId)
    .single();

  if (error) throw error;
  return { success: true };
}

export function AutoResponseSettings({ initialSettings }: AutoResponseSettingsProps) {
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
      ...DEFAULT_SETTINGS,
      ...initialSettings,
      ...settings?.autoResponse,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AutoResponseSettings) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      return updateAutoResponseSettings(values, organization.id);
    },
    onSuccess: () => {
      if (organization?.id) {
        queryClient.invalidateQueries({ queryKey: ['settings', organization.id] });
      }
      toast({
        title: 'Settings saved',
        description: 'Auto-response settings have been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to save auto-response settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save auto-response settings. Please try again.',
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
        <CardTitle>Auto Response Settings</CardTitle>
        <CardDescription>
          Configure how automatic responses are generated for incoming tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='enabled'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>
                      Enable Auto Response
                    </FormLabel>
                    <FormDescription>
                      Automatically generate responses for new tickets
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='tone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Tone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., Professional and friendly'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='language'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Language</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., English' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='responseGuidelines'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Guidelines</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter response guidelines...'
                      className='min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='complianceRequirements'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compliance Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter compliance requirements...'
                      className='min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
