import { TablesInsert, Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

const LINK_EXPIRY_HOURS = 24;

export type PortalLink = {
  token: string;
  contactId: string;
  ticketNumber?: number;
  orgId: string;
  expiresAt: Date;
  used: boolean;
};

export type PortalAccess = {
  portalUser: Tables<"portal_users">;
  contact: Tables<"contacts">;
};

export class PortalService {
  constructor() {}

  private async getClient() {
    return createClient();
  }

  private async getServiceClient() {
    return createServiceClient();
  }

  /**
   * Generates a secure portal access link for a contact
   */
  async generatePortalLink(
    contactId: string,
    ticketId?: string
  ): Promise<string> {
    const supabase = await this.getClient();

    // Get contact details to verify and get org_id
    const { data: contact } = await supabase
      .from('contacts')
      .select('org_id')
      .eq('id', contactId)
      .single();

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Generate secure token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + LINK_EXPIRY_HOURS);

    // Store link metadata
    const portalLink: TablesInsert<'portal_links'> = {
      token,
      contact_id: contactId,
      ticket_id: ticketId || null,
      org_id: contact.org_id,
      expires_at: expiresAt.toISOString(),
      used: false,
    };

    const { error } = await supabase.from('portal_links').insert(portalLink);

    if (error) {
      throw error;
    }

    // Return full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    return `${baseUrl}/portal/verify?token=${token}`;
  }

  /**
   * Validates a portal access token and returns the associated data
   * Uses service role to bypass RLS since this needs to work for unauthenticated users
   */
  async validatePortalLink(token: string): Promise<PortalLink | null> {
    const supabase = await this.getServiceClient();
    const { data } = await supabase
      .from('portal_links')
      .select(`
        *,
        tickets:ticket_id (
          number
        )
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!data) {
      return null;
    }

    return {
      token: data.token,
      contactId: data.contact_id,
      ticketNumber: data.tickets?.number,
      orgId: data.org_id,
      expiresAt: new Date(data.expires_at),
      used: data.used,
    };
  }

  /**
   * Gets or creates a portal user for an auth user and organization
   */
  async getOrCreatePortalAccess(
    authUserId: string,
    orgId: string,
    contactId: string
  ): Promise<PortalAccess> {
    const supabase = await this.getServiceClient();

    // Check if user already has portal access for this org
    const { data: existingPortalUser } = await supabase
      .from('portal_users')
      .select()
      .eq('auth_user_id', authUserId)
      .eq('org_id', orgId)
      .single();

    if (existingPortalUser) {
      // Get associated contact
      const { data: contact } = await supabase
        .from('contacts')
        .select()
        .eq('portal_user_id', existingPortalUser.id)
        .single();

      if (!contact) {
        throw new Error('Portal user exists but no contact found');
      }

      return { portalUser: existingPortalUser, contact };
    }

    // Create new portal user
    const { data: portalUser, error: createError } = await supabase
      .from('portal_users')
      .insert({
        org_id: orgId,
        auth_user_id: authUserId,
      })
      .select()
      .single();

    if (createError || !portalUser) {
      throw createError || new Error('Failed to create portal user');
    }

    // Link contact to portal user
    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update({ portal_user_id: portalUser.id })
      .eq('id', contactId)
      .select()
      .single();

    if (updateError || !contact) {
      // Rollback portal user creation
      await supabase.from('portal_users').delete().eq('id', portalUser.id);
      throw updateError || new Error('Failed to link contact');
    }

    return { portalUser, contact };
  }

  /**
   * Marks a portal link as used
   */
  async markLinkAsUsed(token: string): Promise<void> {
    const supabase = await this.getServiceClient();
    const { error } = await supabase
      .from('portal_links')
      .update({ used: true })
      .eq('token', token);

    if (error) {
      throw error;
    }
  }
}
