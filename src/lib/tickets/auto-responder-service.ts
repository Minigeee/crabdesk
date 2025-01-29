import { SupabaseClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ResponseGraderService } from './grader-service';
import type { Database } from '@/lib/database.types';
import { EmailThread } from '../email/types';
import { EmbeddingService } from '../embeddings/service';

const RESPONDER_PROMPT = `You are an expert customer support agent. Your task is to draft a response to a customer email thread.
Use the provided context to ensure accuracy and alignment with organizational goals.

<context>
Organization Settings:
{orgSettings}

Relevant Notes and Context:
{relevantNotes}

Email Thread:
{thread}
</context>

Draft a response that:
1. Addresses all questions and concerns
2. Uses accurate information from the provided context
3. Aligns with organizational tone and policies
4. Is professional and empathetic
5. Provides clear next steps or resolution

Important: Only use placeholders in square brackets [like this] when the information is not available in the provided context. If the information exists in the context, use it directly instead of a placeholder.

Placeholder Guidelines:
1. Make placeholders as specific as possible (e.g., [API documentation link] instead of just [link])
2. When multiple similar items are needed, make each placeholder unique and descriptive:
   - Links: [API docs link], [feedback form link], [status page link]
   - Features: [requested feature name], [alternative feature name]
   - Products: [current product tier], [suggested product tier]
   - Dates: [maintenance start date], [maintenance end date]
   - Numbers: [current user count], [upgraded user limit]

3. Always include descriptive context in the placeholder name:
   Bad: [name], [link], [date]
   Good: [agent name], [knowledge base link], [expected resolution date]

Response should be in plain text format suitable for email. Do not include subject line or any other metadata.`;

export class AutoResponderService {
  private readonly llm: ChatOpenAI;
  private readonly responderPrompt: PromptTemplate;
  private readonly graderService: ResponseGraderService;
  private readonly embeddings: EmbeddingService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // Do not change this
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.responderPrompt = PromptTemplate.fromTemplate(RESPONDER_PROMPT);
    this.graderService = new ResponseGraderService(supabase);
    this.embeddings = new EmbeddingService(supabase, orgId);
  }

  // Make these methods public for shared data access
  async getRelevantNotes(ticketId: string, thread?: EmailThread) {
    // If no thread provided, get the ticket's contact_id for basic note retrieval
    if (!thread?.messages?.length) {
      const { data: ticket } = await this.supabase
        .from('tickets')
        .select('contact_id')
        .eq('id', ticketId)
        .single();

      // Get notes related to the ticket and contact
      const entityIds = [ticketId];
      if (ticket?.contact_id) {
        entityIds.push(ticket.contact_id);
      }

      const { data: notes, error } = await this.supabase
        .from('notes')
        .select('content, created_at')
        .in('entity_id', entityIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return notes;
    }

    // Use thread messages for semantic search
    // Combine the last few messages to create a meaningful search context
    const searchContext = thread.messages
      .slice(-3) // Use last 3 messages
      .map(msg => msg.text_body)
      .filter(Boolean)
      .join('\n\n');

    if (!searchContext) {
      return []; // No valid text content to search with
    }

    // Perform semantic search using embeddings
    const searchResults = await this.embeddings.searchNotes(searchContext, {
      threshold: 0.6, // Lower threshold for more results
      limit: 5 // Limit to top 5 most relevant notes
    });

    // Transform search results to match expected format
    return (searchResults || []).map(result => ({
      content: result.content,
      // Use a consistent timestamp since search results don't include created_at
      created_at: new Date().toISOString()
    }));
  }

  async getOrgSettings() {
    // TODO: Implement knowledge base and org settings retrieval
    // For now, return basic settings
    return {
      tone: 'professional and friendly',
      language: 'en',
      responseGuidelines: [
        'Always verify customer identity',
        'Provide clear next steps',
        'Include relevant documentation links',
        'Respond as the support team',
      ],
      complianceRequirements: [
        'Do not share sensitive information',
        'Include required disclaimers',
        'Follow data protection guidelines'
      ]
    };
  }

  private formatThreadForResponse(thread: any) {
    return thread.messages
      .map((msg: any) => {
        const sender = msg.from_name || msg.from_email;
        const timestamp = new Date(msg.created_at).toISOString();
        return `[${timestamp}] ${sender}:\n${msg.text_body}\n`;
      })
      .join('\n---\n');
  }

  private formatNotesForContext(notes: any[]) {
    if (!notes?.length) return 'No relevant notes found.';
    return notes
      .map(note => {
        const timestamp = new Date(note.created_at).toISOString();
        return `[${timestamp}] ${note.content}`;
      })
      .join('\n\n');
  }

  async generateDraftResponse(
    thread: EmailThread,
    ticketId: string,
    options?: {
      notes?: { content: string; created_at: string }[];
      orgSettings?: {
        tone: string;
        language: string;
        responseGuidelines: string[];
        complianceRequirements: string[];
      };
    }
  ): Promise<string> {
    if (!thread || !thread.messages || !thread.messages.length) {
      throw new Error('Thread not found or empty');
    }

    // Get all necessary context if not provided
    const [notes, orgSettings] = await Promise.all([
      options?.notes || this.getRelevantNotes(ticketId, thread),
      options?.orgSettings || this.getOrgSettings(),
    ]);

    // Format all context for the prompt
    const threadText = this.formatThreadForResponse(thread);
    const notesText = this.formatNotesForContext(notes);
    const settingsText = JSON.stringify(orgSettings, null, 2);

    // Generate response using LangChain
    const chain = this.responderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const draftResponse = await chain.invoke({
      thread: threadText,
      relevantNotes: notesText,
      orgSettings: settingsText,
    });

    // Grade the response
    const grade = await this.graderService.gradeResponse(thread.id, draftResponse, {
      thread,
      context: notes,
      orgSettings,
    });

    // Store the draft and grade
    const { error } = await this.supabase
      .from('response_drafts')
      .insert({
        org_id: this.orgId,
        thread_id: thread.id,
        ticket_id: ticketId,
        content: draftResponse,
        grade,
        metadata: {
          context_used: {
            had_notes: notes?.length > 0,
            message_count: thread.messages.length,
          }
        }
      });

    if (error) throw error;

    return draftResponse;
  }

  async getDrafts(ticketId: string) {
    const { data: drafts, error } = await this.supabase
      .from('response_drafts')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return drafts;
  }

  async approveDraft(draftId: string, userId: string) {
    const { error } = await this.supabase
      .from('response_drafts')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: userId
      })
      .eq('id', draftId);

    if (error) throw error;
  }

  async modifyDraft(draftId: string, modifiedContent: string, feedback?: string) {
    const { error } = await this.supabase
      .from('response_drafts')
      .update({
        status: 'modified',
        modified_content: modifiedContent,
        feedback
      })
      .eq('id', draftId);

    if (error) throw error;
  }

  async rejectDraft(draftId: string, feedback: string) {
    const { error } = await this.supabase
      .from('response_drafts')
      .update({
        status: 'rejected',
        feedback
      })
      .eq('id', draftId);

    if (error) throw error;
  }
} 