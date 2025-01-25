'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sendTestEmail } from '../actions';

const templates = [
  {
    id: 'new-inquiry',
    title: 'New Customer Inquiry',
    description: 'Simulates a new customer asking about product features',
    scenario: {
      fromEmail: 'potential.customer@example.com',
      fromName: 'Alex Thompson',
      subject: 'Question about Enterprise Features',
      body: "Hi there,\n\nI'm interested in your product for my company. Could you tell me more about your enterprise features, particularly around team management and SSO?\n\nThanks,\nAlex",
    },
  },
  {
    id: 'urgent-issue',
    title: 'Urgent Technical Issue',
    description: 'Customer reporting a critical production issue',
    scenario: {
      fromEmail: 'dev.lead@techcorp.com',
      fromName: 'Sarah Chen',
      subject: 'URGENT: API Integration Down',
      body: 'Hello Support Team,\n\nOur production integration with your API is failing with 500 errors. This is blocking our deployment.\n\nError details:\n- Endpoint: /api/v1/sync\n- Status: 500\n- Time: Last 30 minutes\n\nPlease help ASAP.\n\nBest,\nSarah',
    },
  },
  {
    id: 'feature-request',
    title: 'Feature Request',
    description: 'Customer suggesting a new feature with detailed use case',
    scenario: {
      fromEmail: 'product.manager@startup.co',
      fromName: 'Michael Rodriguez',
      subject: 'Feature Request: Bulk Export',
      body: "Hello,\n\nI love your product but I'm missing a crucial feature. It would be great to have bulk export functionality for reports.\n\nUse case:\n1. Select multiple reports\n2. Export as CSV/Excel\n3. Include custom fields\n\nThis would save us hours of manual work.\n\nLet me know if you need more details.\n\nBest regards,\nMichael",
    },
  },
  {
    id: 'billing-question',
    title: 'Billing Question',
    description: 'Customer asking about invoice and plan upgrade',
    scenario: {
      fromEmail: 'finance@bigcorp.com',
      fromName: 'Emma Williams',
      subject: 'Question about Latest Invoice',
      body: "Hi Billing Team,\n\nI have two questions:\n1. Can you explain the usage charges on invoice #12345?\n2. What's the process for upgrading to the Enterprise plan?\n\nThanks,\nEmma",
    },
  },
];

export function EmailTemplates() {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const sendTemplate = useCallback(async (template: (typeof templates)[0]) => {
    setLoadingId(template.id);
    try {
      const result = await sendTestEmail({
        ...template.scenario,
        toEmail: 'support@acme.com',
        toName: 'Support Team',
        includeAttachments: false,
      });

      toast({
        title: 'Template Sent',
        description: `Sent "${template.title}" (Message ID: ${result.messageId})`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send template',
        variant: 'destructive',
      });
    } finally {
      setLoadingId(null);
    }
  }, [toast]);

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle>{template.title}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm'>
              <div>
                <span className='font-medium'>From: </span>
                {template.scenario.fromName} ({template.scenario.fromEmail})
              </div>
              <div>
                <span className='font-medium'>Subject: </span>
                {template.scenario.subject}
              </div>
              <div className='whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs'>
                {template.scenario.body}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant='secondary'
              className='w-full'
              onClick={() => sendTemplate(template)}
              disabled={loadingId === template.id}
            >
              {loadingId === template.id ? 'Sending...' : 'Send Template'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
