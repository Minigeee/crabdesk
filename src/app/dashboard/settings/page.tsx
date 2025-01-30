import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SettingsContent } from './_components/settings-content';
import { requireUser } from '@/lib/auth/session';
import type { OrganizationSettings } from '@/lib/settings/types';

export const metadata: Metadata = {
  title: 'Settings | CrabDesk',
  description: 'Manage your organization settings',
};

export default async function SettingsPage() {
  const { organization } = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organization.id)
    .single();

  const initialSettings = data?.settings as OrganizationSettings;

  return <SettingsContent initialSettings={initialSettings} />;
}
