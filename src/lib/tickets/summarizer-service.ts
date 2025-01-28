import { SupabaseClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Database } from '@/lib/database.types';
import { EmbeddingService } from '@/lib/embeddings/service';

const SUMMARY_PROMPT = `You are a helpful assistant that summarizes customer support ticket threads.
Your summaries should be concise but informative, following the following format:
<format>
**Main Issue/Request**
*main_issue*

**Current Status**
*current_status*

**Key Details**
*key_details*

**Actions Taken**
*actions_taken*

**Next Steps**
*next_steps*
</format>

Keep the summary professional and factual. Avoid speculation or personal opinions.

Below is the thread so far:

<thread>
{thread}
</thread>

Summary:`;

export class TicketSummarizerService {
  private readonly llm: ChatOpenAI;
  private readonly summaryPrompt: PromptTemplate;
  private readonly embeddings: EmbeddingService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string,
  ) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // Do not change this
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.summaryPrompt = PromptTemplate.fromTemplate(SUMMARY_PROMPT);
    this.embeddings = new EmbeddingService(supabase, orgId);
  }

  private async getEmailThread(ticketId: string) {
    const { data: threads, error } = await this.supabase
      .from('email_threads')
      .select(`
        *,
        messages: email_messages (
          message_id,
          from_email,
          from_name,
          text_body,
          created_at
        )
      `)
      .eq('ticket_id', ticketId)
      .order('last_message_at', { ascending: true })
      .single();

    if (error) throw error;
    return threads;
  }

  private async findExistingSummaryNote(ticketId: string) {
    const { data: note, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('entity_type', 'ticket')
      .eq('entity_id', ticketId)
      .eq('managed', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
    return note;
  }

  private formatThreadForSummary(thread: any) {
    return thread.messages
      .map((msg: any) => {
        const sender = msg.from_name || msg.from_email;
        const timestamp = new Date(msg.created_at).toISOString();
        return `[${timestamp}] ${sender}:\n${msg.text_body}\n`;
      })
      .join('\n---\n');
  }

  async updateTicketSummary(ticketId: string) {
    // Get the email thread and messages
    const thread = await this.getEmailThread(ticketId);
    if (!thread || !thread.messages.length) return;

    // Format thread for summarization
    const threadText = this.formatThreadForSummary(thread);

    // Generate summary using LangChain
    const chain = this.summaryPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const summary = await chain.invoke({
      thread: threadText,
    });

    // Generate embedding for the summary
    const embedding = await this.embeddings.generateEmbedding(summary);

    // Find existing summary note or create new one
    const existingNote = await this.findExistingSummaryNote(ticketId);

    if (existingNote) {
      // Update existing note
      const { error } = await this.supabase
        .from('notes')
        .update({
          content: summary,
          content_embedding: this.embeddings.embedToString(embedding),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingNote.id);

      if (error) throw error;
    } else {
      // Create new note
      const { error } = await this.supabase.from('notes').insert({
        org_id: this.orgId,
        entity_type: 'ticket',
        entity_id: ticketId,
        content: summary,
        content_embedding: this.embeddings.embedToString(embedding),
        managed: true,
        metadata: {
          type: 'ticket_summary',
        },
      });

      if (error) throw error;
    }
  }
} 