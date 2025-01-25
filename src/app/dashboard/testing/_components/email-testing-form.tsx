'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useEmailTesting } from './email-testing-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sendTestEmail } from '../actions';

const formSchema = z.object({
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  toEmail: z.string().email(),
  toName: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  includeAttachments: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function EmailTestingForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { selectedThread, setSelectedThread } = useEmailTesting();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromEmail: selectedThread?.from_email ?? '',
      fromName: '',
      toEmail: selectedThread?.to_email ?? '',
      toName: '',
      subject: selectedThread?.subject ? `Re: ${selectedThread.subject}` : '',
      body: '',
      includeAttachments: false,
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const result = await sendTestEmail({
        ...data,
        toName: data.toName ?? '',
        inReplyTo: selectedThread?.messages[selectedThread.messages.length - 1]?.message_id,
      });

      if (selectedThread) {
        setSelectedThread(null);
      }

      toast({
        title: 'Test Email Sent',
        description: `Message ID: ${result.messageId}`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      {selectedThread && (
        <Alert className="mb-6">
          <AlertDescription>
            Replying to thread: {selectedThread.subject}
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='fromEmail'
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Email</FormLabel>
                <FormControl>
                  <Input placeholder='customer@example.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='fromName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Name</FormLabel>
                <FormControl>
                  <Input placeholder='John Doe' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='toEmail'
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Email</FormLabel>
                <FormControl>
                  <Input placeholder='support@company.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='toName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Name</FormLabel>
                <FormControl>
                  <Input placeholder='Support Team' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='subject'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder='Need help with...' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='body'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Body</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Type your message here...'
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
          name='includeAttachments'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Include Attachments</FormLabel>
                <FormDescription>
                  Automatically generate test PDF and image attachments
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Test Email'}
        </Button>
      </form>
    </Form>
  );
}
