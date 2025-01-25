'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { EmailHistory } from './_components/email-history';
import { EmailTemplates } from './_components/email-templates';
import { EmailTestingForm } from './_components/email-testing-form';
import { EmailTestingProvider } from './_components/email-testing-provider';

export default function TestingPage() {
  const [tab, setTab] = useState<string>('email');

  return (
    <EmailTestingProvider tab={tab} setTab={setTab}>
      <ScrollArea className='h-full'>
        <div className='container p-6'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold tracking-tight'>Testing Tools</h1>
            <p className='text-muted-foreground'>
              Tools for testing email processing and ticket creation
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
            <TabsList>
              <TabsTrigger value='email'>Email Testing</TabsTrigger>
              <TabsTrigger value='templates'>Templates</TabsTrigger>
              <TabsTrigger value='history'>History</TabsTrigger>
            </TabsList>

            <TabsContent value='email' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Send Test Email</CardTitle>
                  <CardDescription>
                    Generate and send test emails to simulate customer
                    interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailTestingForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='templates' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Pre-configured templates for common testing scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailTemplates />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='history' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Email History</CardTitle>
                  <CardDescription>
                    View and select email threads for testing replies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailHistory />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </EmailTestingProvider>
  );
}
