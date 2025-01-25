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

  async getThreadsForTicket(ticketId: string) {
    const { data: threads, error } = await this.supabase
      .from('email_threads')
      .select(`
        *,
        messages: email_messages (*)
      `)
      .eq('ticket_id', ticketId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return threads;
  }

  async writeEmailReply({
    threadId,
    fromEmail,
    fromName,
    toEmails,
    subject,
    textBody,
    htmlBody,
    inReplyTo,
    referenceIds,
  }: {
    threadId: string;
    fromEmail: string;
    fromName: string;
    toEmails: string[];
    subject: string;
    textBody: string;
    htmlBody?: string;
    inReplyTo?: string;
    referenceIds?: string[];
  }) {
    const messageId = `${Date.now()}.${Math.random().toString(36).substring(2)}@${fromEmail.split('@')[1]}`;
    const now = new Date().toISOString();

    // Create the message
    const { data: message, error: messageError } = await this.supabase
      .from('email_messages')
      .insert({
        thread_id: threadId,
        message_id: messageId,
        in_reply_to: inReplyTo,
        reference_ids: referenceIds,
        from_email: fromEmail,
        from_name: fromName,
        to_emails: toEmails,
        subject,
        text_body: textBody,
        html_body: htmlBody,
        headers: {},
        created_at: now,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Update thread last_message_at
    const { error: threadError } = await this.supabase
      .from('email_threads')
      .update({
        last_message_at: now,
      })
      .eq('id', threadId);

    if (threadError) throw threadError;

    return message;
  }
} 