'use client';

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
import { useCallback, useState } from 'react';
import { sendTestEmail } from '../actions';

const templates = [
  {
    id: 'residential-quote',
    title: 'Basic Residential Quote Request',
    description: 'New customer requesting solar panel installation quote',
    scenario: {
      fromEmail: 'sarah.johnson@email.com',
      fromName: 'Sarah Johnson',
      subject: 'Solar Panel Installation Quote',
      body: "Hi, I'm interested in getting solar panels installed at my new home in Austin. It's a 2,500 sq ft single-story house. Could you provide information about your basic solar package and pricing?\n\nThanks,\nSarah",
    },
  },
  {
    id: 'system-failure',
    title: 'Urgent System Failure (Medical)',
    description: 'Critical system failure affecting medical equipment',
    scenario: {
      fromEmail: 'robert.chen@email.com',
      fromName: 'Robert Chen',
      subject: 'URGENT - Complete System Failure - Medical Equipment at Risk',
      body: 'Our entire solar system and battery backup installed last month has stopped working. We have medical equipment that requires constant power. Need immediate help.\n\nAddress: 1234 Oak Street, Houston.',
    },
  },
  {
    id: 'commercial-inquiry',
    title: 'Commercial Multi-Site Inquiry',
    description: 'Enterprise customer inquiring about multiple locations',
    scenario: {
      fromEmail: 'maria.garcia@bigretail.com',
      fromName: 'Maria Garcia',
      subject: 'Solar Installation for Multiple Retail Locations',
      body: "I'm the facilities manager for BigRetail Corp. We're interested in solar installation for our 5 locations in Texas. Looking for information on your commercial solutions and bulk pricing. Need ROI calculations for each site.",
    },
  },
  {
    id: 'storm-damage',
    title: 'Post-Storm Damage Assessment',
    description: 'Customer reporting storm damage to solar installation',
    scenario: {
      fromEmail: 'david.smith@email.com',
      fromName: 'David Smith',
      subject: 'Damage to Solar Panels After Storm',
      body: 'We had a severe storm last night and I noticed some panels appear to be damaged. System is showing reduced output. Need someone to check ASAP. Installation was done 6 months ago.',
    },
  },
  {
    id: 'smart-home',
    title: 'Smart Home Integration Query',
    description: 'Existing customer requesting smart home upgrade',
    scenario: {
      fromEmail: 'lisa.wong@email.com',
      fromName: 'Lisa Wong',
      subject: 'Smart Home Integration with Existing System',
      body: 'We have your basic solar system installed last year. Interested in upgrading to the smart home features. Can you tell me about compatibility with Nest and Ring devices? Also interested in battery storage options.',
    },
  },
  {
    id: 'performance-issue',
    title: 'Performance Optimization Request',
    description: 'Customer reporting underperforming system',
    scenario: {
      fromEmail: 'james.wilson@email.com',
      fromName: 'James Wilson',
      subject: 'System Performance Below Expectations',
      body: "Our system was installed 3 months ago and we're not seeing the energy savings promised. Monthly bills are only 15% lower instead of the projected 40%. Need someone to look into this.",
    },
  },
  {
    id: 'battery-emergency',
    title: 'Battery Storage Emergency',
    description: 'Customer experiencing battery failure during outage',
    scenario: {
      fromEmail: 'emily.brown@email.com',
      fromName: 'Emily Brown',
      subject: 'Battery Not Working During Power Outage',
      body: "We're currently in a power outage and our backup battery isn't working. The system shows error code E-443. This is our first outage since installation last month.",
    },
  },
  {
    id: 'monitoring-issue',
    title: 'Commercial Monitoring System Issue',
    description: 'Enterprise customer reporting monitoring platform outage',
    scenario: {
      fromEmail: 'thomas.anderson@techcorp.com',
      fromName: 'Thomas Anderson',
      subject: 'Enterprise Monitoring System Down',
      body: "The SolarTech Monitor platform for our 3 office locations has been unresponsive for the last hour. Can't access any performance data or control systems. This is affecting our operations.",
    },
  },
  {
    id: 'warranty-claim',
    title: 'Warranty Claim Investigation',
    description: 'Customer reporting premature panel degradation',
    scenario: {
      fromEmail: 'karen.martinez@email.com',
      fromName: 'Karen Martinez',
      subject: 'Panel Degradation Warranty Claim',
      body: "We've noticed significant degradation in our panels after just 1 year. Output has dropped by 30% according to our monitoring system. This should be covered under warranty. Need this investigated.",
    },
  },
  {
    id: 'mobile-app',
    title: 'Mobile App Technical Support',
    description: 'Customer unable to access mobile monitoring app',
    scenario: {
      fromEmail: 'michael.taylor@email.com',
      fromName: 'Michael Taylor',
      subject: "Can't Access Mobile App",
      body: 'Getting "Authentication Failed" error when trying to log into the SolarTech mobile app. Tried resetting password but not receiving reset emails. Need access to monitor my system.',
    },
  },
];

export function EmailTemplates() {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const sendTemplate = useCallback(
    async (template: (typeof templates)[0]) => {
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
          description:
            error instanceof Error ? error.message : 'Failed to send template',
          variant: 'destructive',
        });
      } finally {
        setLoadingId(null);
      }
    },
    [toast]
  );

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
