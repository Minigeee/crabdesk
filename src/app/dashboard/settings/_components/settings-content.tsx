'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutoResponseSettings } from './auto-response-settings';
import { PriorityCriteriaSettings } from './priority-criteria-settings';
import { ArticlesSettings } from './articles-settings';
import type { OrganizationSettings } from '@/lib/settings/types';
import { useAuth } from '@/lib/auth/hooks';

interface SettingsContentProps {
  initialSettings: OrganizationSettings;
}

export function SettingsContent({ initialSettings }: SettingsContentProps) {
  const { organization } = useAuth();

  return (
    <div className='container mx-auto p-6'>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
          <p className='text-muted-foreground'>
            Configure your organization's auto-response and priority criteria
            settings
          </p>
        </div>

        <Tabs defaultValue='auto-response' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='auto-response'>Auto Response</TabsTrigger>
            <TabsTrigger value='priority'>Priority Criteria</TabsTrigger>
            <TabsTrigger value='articles'>Knowledge Base</TabsTrigger>
          </TabsList>

          <TabsContent value='auto-response' className='space-y-4'>
            <AutoResponseSettings initialSettings={initialSettings?.autoResponse} />
          </TabsContent>

          <TabsContent value='priority' className='space-y-4'>
            <PriorityCriteriaSettings initialSettings={initialSettings?.priorityCriteria} />
          </TabsContent>

          <TabsContent value='articles' className='space-y-4'>
            <ArticlesSettings orgId={organization?.id} />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
} 