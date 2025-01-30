import { SupabaseClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ResponseGraderService } from './grader-service';
import type { Database } from '@/lib/database.types';
import { EmailThread } from '../email/types';
import { EmbeddingService } from '../embeddings/service';
import type { AutoResponseSettings } from '@/lib/settings/types';

const RESPONDER_PROMPT = `You are an expert customer support agent. Your task is to draft a response to a customer email thread.
Use the provided context to ensure accuracy and alignment with organizational goals.

<context>
Auto-Response Settings:
Tone: {tone}
Language: {language}

Response Guidelines:
{responseGuidelines}

Compliance Requirements:
{complianceRequirements}

Relevant Notes and Context:
{relevantNotes}
</context>

<thread>
{thread}
</thread>

Draft a response that:
1. Addresses all questions and concerns
2. Uses accurate information from the provided context
3. Aligns with the specified tone and language
4. Is professional and empathetic
5. Provides clear next steps or resolution
6. Follows all response guidelines and compliance requirements

Placeholder Guidelines:
- Only use placeholders in square brackets when the information is not available in the provided context.
  Ex: "Check out our api documentation at [api documentation link]"

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
      temperature: 0.8,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.responderPrompt = PromptTemplate.fromTemplate(RESPONDER_PROMPT);
    this.graderService = new ResponseGraderService(supabase);
    this.embeddings = new EmbeddingService(supabase, orgId);
  }

  async getAutoResponseSettings(): Promise<AutoResponseSettings> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('settings')
      .eq('id', this.orgId)
      .single();

    if (error) throw error;

    const defaultSettings: AutoResponseSettings = {
      enabled: true,
      tone: 'Professional and friendly',
      language: 'English',
      responseGuidelines: 'Begin with a greeting, acknowledge the issue, provide clear next steps or solutions, and end with a professional closing.',
      complianceRequirements: 'Include data privacy disclaimer when discussing sensitive information. Never share customer data or internal system details.',
    };

    const settings = data.settings as any;
    const orgSettings = settings?.autoResponse || {};

    // Merge with defaults, using org settings when available
    return {
      enabled: orgSettings.enabled ?? defaultSettings.enabled,
      tone: orgSettings.tone || defaultSettings.tone,
      language: orgSettings.language || defaultSettings.language,
      responseGuidelines: orgSettings.responseGuidelines || defaultSettings.responseGuidelines,
      complianceRequirements: orgSettings.complianceRequirements || defaultSettings.complianceRequirements,
    };
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
      settings?: AutoResponseSettings;
    }
  ): Promise<string | null> {
    if (!thread || !thread.messages || !thread.messages.length) {
      throw new Error('Thread not found or empty');
    }

    // Get auto-response settings
    const settings = options?.settings || await this.getAutoResponseSettings();

    // Check if auto-response is enabled
    if (!settings.enabled) {
      return null;
    }

    // Get relevant notes if not provided
    const notes = options?.notes || await this.getRelevantNotes(ticketId, thread);

    // Format all context for the prompt
    const threadText = this.formatThreadForResponse(thread);
    const notesText = this.formatNotesForContext(notes);

    // Generate response using LangChain
    const chain = this.responderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const draftResponse = await chain.invoke({
      thread: threadText,
      relevantNotes: notesText,
      tone: settings.tone,
      language: settings.language,
      responseGuidelines: settings.responseGuidelines,
      complianceRequirements: settings.complianceRequirements,
    });

    // Grade the response
    const grade = await this.graderService.gradeResponse(thread.id, draftResponse, {
      thread,
      context: notes,
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
        status: 'pending',
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