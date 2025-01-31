import type { Database } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import type {
  AutoResponseSettings,
  OrganizationSettings,
  PriorityCriteria,
} from './types';

export class SettingsService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {}

  async getSettings(): Promise<OrganizationSettings> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('settings')
      .eq('id', this.orgId)
      .single();

    if (error) throw error;

    const defaultSettings: OrganizationSettings = {
      autoResponse: {
        enabled: false,
        tone: 'Professional and friendly',
        language: 'English',
        responseGuidelines:
          'Begin with a greeting, acknowledge the issue, provide clear next steps or solutions, and end with a professional closing.',
        complianceRequirements:
          'Include data privacy disclaimer when discussing sensitive information.',
      },
      priorityCriteria: {
        urgent:
          'Critical system outages, security incidents, or issues blocking entire business operations',
        high: 'Significant business impact, major feature not working, or multiple users affected',
        normal: 'Standard questions, minor issues, or individual user problems',
        low: 'Information requests, feature suggestions, or non-critical feedback',
      },
    };

    const settings = data.settings as any;
    return {
      autoResponse: {
        ...defaultSettings.autoResponse,
        ...settings?.autoResponse,
      },
      priorityCriteria: {
        ...defaultSettings.priorityCriteria,
        ...settings?.priorityCriteria,
      },
    };
  }

  async updateAutoResponseSettings(
    settings: AutoResponseSettings
  ): Promise<void> {
    const { data: current } = await this.supabase
      .from('organizations')
      .select('settings')
      .eq('id', this.orgId)
      .single();

    const currentSettings = (current?.settings as OrganizationSettings) || {};

    const updatedSettings: OrganizationSettings = {
      ...currentSettings,
      autoResponse: settings,
    };

    const { error } = await this.supabase
      .from('organizations')
      .update({ settings: updatedSettings as any })
      .eq('id', this.orgId);

    if (error) throw error;
  }

  async updatePriorityCriteria(criteria: PriorityCriteria): Promise<void> {
    const { data: current } = await this.supabase
      .from('organizations')
      .select('settings')
      .eq('id', this.orgId)
      .single();

    const currentSettings = (current?.settings as OrganizationSettings) || {};

    const updatedSettings: OrganizationSettings = {
      ...currentSettings,
      priorityCriteria: criteria,
    };

    const { error } = await this.supabase
      .from('organizations')
      .update({ settings: updatedSettings as any })
      .eq('id', this.orgId);

    if (error) throw error;
  }
}
