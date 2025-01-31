import type { Database } from '@/lib/database.types';
import { EmbeddingService } from '@/lib/embeddings/service';
import type { PriorityCriteria } from '@/lib/settings/types';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { EmailThread } from '../email/types';

const SUMMARY_PROMPT = `You are a helpful assistant that summarizes customer support ticket threads.
Your summaries should be concise but informative, following the following format:
<format>
**Main Issue/Request**
*main_issue*

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

const PRIORITY_PROMPT = `You are a helpful assistant that classifies the priority of customer support tickets.
Based on the content and the organization's priority criteria, classify this ticket's priority as one of: low, normal, high, urgent

<priority_criteria>
Urgent Priority:
{urgentCriteria}

High Priority:
{highCriteria}

Normal Priority:
{normalCriteria}

Low Priority:
{lowCriteria}
</priority_criteria>

Below is the message content:

<content>
{content}
</content>

Additional Context:
- Customer Tier: {customerTier}
- Previous Priority: {previousPriority}

Respond with ONLY the priority level (low, normal, high, or urgent) and nothing else.`;

const prioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
type TicketPriority = z.infer<typeof prioritySchema>;

export class TicketSummarizerService {
  private readonly llm: ChatOpenAI;
  private readonly summaryPrompt: PromptTemplate;
  private readonly priorityPrompt: PromptTemplate;
  private readonly embeddings: EmbeddingService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // Do not change this
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.summaryPrompt = PromptTemplate.fromTemplate(SUMMARY_PROMPT);
    this.priorityPrompt = PromptTemplate.fromTemplate(PRIORITY_PROMPT);
    this.embeddings = new EmbeddingService(supabase, orgId);
  }

  private async getPriorityCriteria(): Promise<PriorityCriteria> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('settings')
      .eq('id', this.orgId)
      .single();

    if (error) throw error;

    const defaultCriteria: PriorityCriteria = {
      urgent:
        'System failures or issues that: (1) affect medical equipment or life-critical systems, (2) cause complete loss of power during emergencies, (3) create immediate safety risks, or (4) leave essential equipment without backup power',
      high: 'Issues involving: (1) commercial/enterprise-wide impacts, (2) physical system damage, (3) performance degradation >25%, (4) multi-site system failures, (5) complete monitoring/control loss for business customers, or (6) warranty claims for major system defects',
      normal:
        'Standard requests including: (1) sales inquiries, (2) feature upgrades, (3) individual residential support, (4) non-critical software issues, or (5) general information requests without immediate impact',
      low: 'Minor requests including: (1) general feedback, (2) documentation requests, (3) feature suggestions, or (4) inquiries without current system impact',
    };

    const settings = data.settings as any;
    const orgCriteria = settings?.priorityCriteria || {};

    // Merge with defaults, using org settings when available
    return {
      urgent: orgCriteria.urgent || defaultCriteria.urgent,
      high: orgCriteria.high || defaultCriteria.high,
      normal: orgCriteria.normal || defaultCriteria.normal,
      low: orgCriteria.low || defaultCriteria.low,
    };
  }

  // Make this method public for shared data access
  async findExistingSummaryNote(
    ticketId: string
  ): Promise<
    { id: string; content: string; content_embedding: string } | undefined
  > {
    const { data: note, error } = await this.supabase
      .from('notes')
      .select('id, content, content_embedding')
      .eq('entity_type', 'ticket')
      .eq('entity_id', ticketId)
      .eq('managed', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error

    // Return undefined if note is null or content_embedding is null
    if (!note || !note.content_embedding) return undefined;

    return {
      id: note.id,
      content: note.content,
      content_embedding: note.content_embedding,
    };
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

  async classifyPriority(
    content: string,
    options?: {
      customerTier?: string;
      previousPriority?: TicketPriority;
    }
  ): Promise<TicketPriority> {
    const priorityCriteria = await this.getPriorityCriteria();

    // If no criteria are set, default to normal priority
    if (
      !priorityCriteria.urgent &&
      !priorityCriteria.high &&
      !priorityCriteria.normal &&
      !priorityCriteria.low
    ) {
      return 'normal';
    }

    const chain = this.priorityPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const result = await chain.invoke({
      content,
      urgentCriteria: priorityCriteria.urgent,
      highCriteria: priorityCriteria.high,
      normalCriteria: priorityCriteria.normal,
      lowCriteria: priorityCriteria.low,
      customerTier: options?.customerTier || 'unknown',
      previousPriority: options?.previousPriority || 'none',
    });

    // Parse and validate the priority
    try {
      return prioritySchema.parse(result.toLowerCase().trim());
    } catch (error) {
      console.warn('Invalid priority classification:', result, error);
      return 'normal'; // Default to normal if parsing fails
    }
  }

  async updateTicketSummary(
    ticketId: string,
    thread: EmailThread,
    options?: {
      existingNote?: { id: string; content: string; content_embedding: string };
    }
  ) {
    if (!thread || !thread.messages || !thread.messages.length) return;

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

    // Find existing summary note or create new one if not provided
    const existingNote =
      options?.existingNote || (await this.findExistingSummaryNote(ticketId));

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
