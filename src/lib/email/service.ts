import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { EmailProcessingResult, ProcessedEmailData } from './types';
import type { Json } from '@/lib/database.types';

export class EmailProcessingService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {}

  async processEmail(data: ProcessedEmailData): Promise<EmailProcessingResult> {
    // Start a transaction
    const { data: result, error } = await this.supabase.rpc('process_email', {
      p_org_id: this.orgId,
      p_from_email: data.from.email,
      p_from_name: data.from.name ?? '',
      p_to_email: data.to[0].email,
      p_subject: data.subject,
      p_message_id: data.messageId,
      p_in_reply_to: data.inReplyTo ?? undefined,
      p_reference_ids: data.referenceIds ?? [],
      p_headers: data.headers as Json,
      p_text_body: data.textBody ?? '',
      p_html_body: data.htmlBody ?? '',
      p_raw_payload: JSON.parse(JSON.stringify(data)) as Json,
    });

    if (error) {
      console.error('Error processing email:', error);
      throw error;
    }

    if (!result) {
      throw new Error('No result returned from email processing');
    }

    return result as unknown as EmailProcessingResult;
  }

  private async findOrCreateContact(email: string, name: string | null = null) {
    const now = new Date().toISOString();

    // Try to find existing contact
    const { data: contact, error: findError } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (contact) {
      // Update last seen and name if provided
      const { data: updated, error: updateError } = await this.supabase
        .from('contacts')
        .update({
          last_seen_at: now,
          name: name || contact.name,
        })
        .eq('id', contact.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    }

    // Create new contact
    const { data: created, error: createError } = await this.supabase
      .from('contacts')
      .insert({
        org_id: this.orgId,
        email,
        name,
        first_seen_at: now,
        last_seen_at: now,
      })
      .select()
      .single();

    if (createError) throw createError;
    return created;
  }

  private async findExistingThread(messageId: string, inReplyTo: string | null, referenceIds: string[]) {
    if (!inReplyTo && !referenceIds.length) {
      return null;
    }

    // Try to find by in-reply-to first
    if (inReplyTo) {
      const { data: thread } = await this.supabase
        .from('email_threads')
        .select('*')
        .eq('org_id', this.orgId)
        .eq('message_id', inReplyTo)
        .single();

      if (thread) return thread;
    }

    // Try to find by reference IDs
    if (referenceIds.length) {
      const { data: thread } = await this.supabase
        .from('email_threads')
        .select('*')
        .eq('org_id', this.orgId)
        .contains('provider_message_ids', referenceIds)
        .single();

      if (thread) return thread;
    }

    return null;
  }

  private async createTicket(contact_id: string, subject: string) {
    const { data: ticket, error } = await this.supabase
      .from('tickets')
      .insert({
        org_id: this.orgId,
        contact_id,
        subject,
        status: 'open',
        priority: 'normal',
        source: 'email',
      })
      .select()
      .single();

    if (error) throw error;
    return ticket;
  }

  private async createThread(
    ticket_id: string,
    data: ProcessedEmailData,
    provider_thread_id: string
  ) {
    const now = new Date().toISOString();
    const { data: thread, error } = await this.supabase
      .from('email_threads')
      .insert({
        org_id: this.orgId,
        ticket_id,
        provider_thread_id,
        provider_message_ids: [data.messageId],
        from_email: data.from.email,
        to_email: data.to[0].email,
        subject: data.subject,
        last_message_at: now,
        message_id: data.messageId,
        in_reply_to: data.inReplyTo ?? null,
        reference_ids: data.referenceIds ?? [],
        headers: data.headers as Json,
        raw_payload: JSON.parse(JSON.stringify(data)) as Json,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return thread;
  }

  private async createMessage(thread_id: string, data: ProcessedEmailData) {
    const now = new Date().toISOString();
    const { data: message, error } = await this.supabase
      .from('email_messages')
      .insert({
        thread_id,
        message_id: data.messageId,
        in_reply_to: data.inReplyTo ?? null,
        reference_ids: data.referenceIds ?? [],
        from_email: data.from.email,
        from_name: data.from.name ?? null,
        to_emails: data.to.map(to => to.email),
        cc_emails: data.cc?.map(cc => cc.email) ?? null,
        bcc_emails: data.bcc?.map(bcc => bcc.email) ?? null,
        subject: data.subject,
        text_body: data.textBody ?? null,
        html_body: data.htmlBody ?? null,
        headers: data.headers as Json,
        created_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return message;
  }
} 