import type { Database } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import type { EmailContent, EmailProvider } from '../types';

export class DatabaseEmailProvider implements EmailProvider {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {}

  async fetchMessage(messageId: string): Promise<EmailContent> {
    const { data: message, error } = await this.supabase
      .from('email_messages')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error) throw error;
    if (!message) throw new Error(`Message not found: ${messageId}`);

    return {
      messageId: message.message_id,
      inReplyTo: message.in_reply_to,
      referenceIds: message.reference_ids ?? [],
      from: {
        email: message.from_email,
        name: message.from_name,
      },
      to: message.to_emails.map((email) => ({ email })),
      cc: message.cc_emails?.map((email) => ({ email })),
      bcc: message.bcc_emails?.map((email) => ({ email })),
      subject: message.subject,
      textBody: message.text_body,
      htmlBody: message.html_body,
      headers: message.headers as Record<string, string>,
    };
  }

  async fetchThread(threadId: string): Promise<EmailContent[]> {
    const { data: messages, error } = await this.supabase
      .from('email_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!messages.length) throw new Error(`Thread not found: ${threadId}`);

    return messages.map((message) => ({
      messageId: message.message_id,
      inReplyTo: message.in_reply_to,
      referenceIds: message.reference_ids ?? [],
      from: {
        email: message.from_email,
        name: message.from_name,
      },
      to: message.to_emails.map((email) => ({ email })),
      cc: message.cc_emails?.map((email) => ({ email })),
      bcc: message.bcc_emails?.map((email) => ({ email })),
      subject: message.subject,
      textBody: message.text_body,
      htmlBody: message.html_body,
      headers: message.headers as Record<string, string>,
    }));
  }

  async sendMessage(content: EmailContent): Promise<void> {
    console.log('Sending message through database provider', content);
    throw new Error(
      'Sending messages through database provider is not supported'
    );
  }
}
