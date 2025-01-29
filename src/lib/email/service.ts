import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { EmailProcessingResult, ProcessedEmailData } from './types';
import type { Json } from '@/lib/database.types';
import { TicketSummarizerService } from '@/lib/tickets/summarizer-service';
import { EmbeddingService } from '@/lib/embeddings/service';

export class EmailProcessingService {
  private readonly summarizer: TicketSummarizerService;
  private readonly embeddings: EmbeddingService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {
    this.summarizer = new TicketSummarizerService(supabase, orgId);
    this.embeddings = new EmbeddingService(supabase, orgId);
  }

  private async handlePostProcessing(
    result: EmailProcessingResult,
    content: string
  ): Promise<void> {
    try {
      // Check if this created a new ticket by looking at the thread's message count
      const isNewTicket = result.thread.provider_message_ids.length === 1;

      if (isNewTicket) {
        // Classify priority for new tickets
        const priority = await this.summarizer.classifyPriority(content);
        
        // Update the ticket priority
        const { error: updateError } = await this.supabase
          .from('tickets')
          .update({ priority })
          .eq('id', result.ticket.id);

        if (updateError) {
          console.error('Error updating ticket priority:', updateError);
        }
      }

      // Update the ticket summary
      await this.summarizer.updateTicketSummary(result.ticket.id);
    } catch (error) {
      // Log errors but don't throw since this is background processing
      console.error('Error in post-processing tasks:', error);
    }
  }

  async processEmail(data: ProcessedEmailData): Promise<EmailProcessingResult> {
    // Generate embedding for the new message
    const content = data.textBody || data.htmlBody || '';
    const embedding = await this.embeddings.generateEmbedding(content);

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
      p_content_embedding: this.embeddings.embedToString(embedding),
    });

    if (error) {
      console.error('Error processing email:', error);
      throw error;
    }

    if (!result) {
      throw new Error('No result returned from email processing');
    }

    const typedResult = result as unknown as EmailProcessingResult;

    // Start post-processing tasks in the background
    // We use void to explicitly indicate we're not waiting for the promise
    void this.handlePostProcessing(typedResult, content);

    return typedResult;
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

    // Generate embedding for the reply
    const content = textBody || htmlBody || '';
    const embedding = await this.embeddings.generateEmbedding(content);

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
        content_embedding: this.embeddings.embedToString(embedding),
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

    // Get ticket ID from thread to update summary
    const { data: thread } = await this.supabase
      .from('email_threads')
      .select('ticket_id')
      .eq('id', threadId)
      .single();

    if (thread) {
      try {
        await this.summarizer.updateTicketSummary(thread.ticket_id);
      } catch (summaryError) {
        console.error('Error updating ticket summary:', summaryError);
      }
    }

    return message;
  }
} 