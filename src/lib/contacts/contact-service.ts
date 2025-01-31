import { Tables, TablesInsert } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export type Contact = Tables<'contacts'> & {
  open_tickets_count: number;
  total_tickets_count: number;
};

export type ContactInsert = TablesInsert<'contacts'>;

export type ContactSearchParams = {
  query?: string;
  limit?: number;
  offset?: number;
  orderBy?: {
    column: keyof Contact;
    ascending?: boolean;
  };
};

export type ContactSearchResult = {
  data: Contact[];
  count: number;
};

export class ContactError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ContactError';
  }
}

export class ContactService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly orgId: string
  ) {}

  async searchContacts({
    query = '',
    limit = 10,
    offset = 0,
    orderBy = { column: 'last_seen_at', ascending: false },
  }: ContactSearchParams = {}): Promise<ContactSearchResult> {
    try {
      const { data, error } = await this.supabase.rpc('search_contacts', {
        p_org_id: this.orgId,
        p_query: query,
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy.column,
        p_ascending: orderBy.ascending,
      });

      if (error) throw error;
      if (!data?.[0]) return { data: [], count: 0 };

      return {
        data: (data[0].contacts || []) as Contact[],
        count: data[0].total_count || 0,
      };
    } catch (error) {
      throw new ContactError('Failed to search contacts', error);
    }
  }

  async getContactByEmail(email: string): Promise<Contact | null> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('org_id', this.orgId)
        .eq('email', email)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new ContactError('Failed to get contact by email', error);
    }
  }

  async createContact(
    contact: Omit<ContactInsert, 'org_id'>
  ): Promise<Contact> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .insert([{ ...contact, org_id: this.orgId }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new ContactError('Failed to create contact', error);
    }
  }

  async updateContact(
    id: string,
    updates: Partial<Omit<ContactInsert, 'org_id' | 'email'>>
  ): Promise<Contact> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .update(updates)
        .eq('org_id', this.orgId)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new ContactError('Failed to update contact', error);
    }
  }

  async getContactById(id: string): Promise<Contact | null> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('org_id', this.orgId)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new ContactError('Failed to get contact by id', error);
    }
  }
}
