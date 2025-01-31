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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/hooks';
import type {
  GraderSettings,
  OrganizationSettings,
} from '@/lib/settings/types';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  enabled: z.boolean(),
  qualityGuidelines: z.string().min(1),
  accuracyGuidelines: z.string().min(1),
  minimumQualityScore: z.number().min(1).max(5),
  minimumAccuracyScore: z.number().min(1).max(5),
});

interface GraderSettingsProps {
  initialSettings?: GraderSettings;
}

const DEFAULT_SETTINGS: GraderSettings = {
  enabled: true,
  qualityGuidelines: `1. Professional tone and language
2. Clear and concise communication
3. Proper grammar and formatting
4. Appropriate level of detail
5. Positive and helpful attitude`,
  accuracyGuidelines: `1. Information matches knowledge base
2. Follows organization policies
3. Uses correct technical terminology
4. Provides accurate solutions
5. Avoids assumptions`,
  minimumQualityScore: 3,
  minimumAccuracyScore: 3,
};

async function updateGraderSettings(settings: GraderSettings, orgId: string) {
  const supabase = createClient();
  const { data: current } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  const currentSettings = (current?.settings || {}) as OrganizationSettings;
  const updatedSettings = {
    ...currentSettings,
    grader: settings,
  };

  const { error } = await supabase
    .from('organizations')
    .update({ settings: updatedSettings as any })
    .eq('id', orgId)
    .single();

  if (error) throw error;
  return { success: true };
}

export function GraderSettings({ initialSettings }: GraderSettingsProps) {
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
      ...settings?.grader,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: GraderSettings) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      return updateGraderSettings(values, organization.id);
    },
    onSuccess: () => {
      if (organization?.id) {
        queryClient.invalidateQueries({
          queryKey: ['settings', organization.id],
        });
      }
      toast({
        title: 'Settings saved',
        description: 'Response grader settings have been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to save grader settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save grader settings. Please try again.',
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
        <CardTitle>Response Grader Settings</CardTitle>
        <CardDescription>
          Configure how responses are evaluated for quality and accuracy
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
                      Enable Response Grading
                    </FormLabel>
                    <FormDescription>
                      Automatically grade responses for quality and accuracy
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
              name='qualityGuidelines'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Guidelines</FormLabel>
                  <FormDescription>
                    Define criteria for evaluating response quality and
                    professionalism
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder='Enter quality guidelines...'
                      className='min-h-[150px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='accuracyGuidelines'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accuracy Guidelines</FormLabel>
                  <FormDescription>
                    Define criteria for evaluating response accuracy and
                    alignment with policies
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder='Enter accuracy guidelines...'
                      className='min-h-[150px]'
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
