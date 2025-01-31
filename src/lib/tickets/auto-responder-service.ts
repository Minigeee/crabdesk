import type { Database } from '@/lib/database.types';
import type { AutoResponseSettings } from '@/lib/settings/types';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { EmailThread } from '../email/types';
import { EmbeddingService } from '../embeddings/service';
import { ResponseGraderService } from './grader-service';
import {
  getSemanticallySimilarArticleChunks,
  getSemanticallySimilarNotes,
} from './utils';

const RESPONDER_PROMPT = `You are an expert customer support agent. Your task is to draft a response to a customer email thread.
Use the provided context to ensure accuracy and alignment with organizational goals.

<settings>
Auto-Response Settings:
Tone: {tone}
Language: {language}

Response Guidelines:
{responseGuidelines}

Compliance Requirements:
{complianceRequirements}
</settings>

Relevant Notes and Context:
<context>
{relevantNotes}
</context>

Thread:
<thread>
{thread}
</thread>

Placeholder Guidelines:
- Only use placeholders in square brackets when the information is not available in the provided context.
  Ex: "Check out our api documentation at [api documentation link]"
- If you have access to the required link or contact information, use it rather than using a placeholder.

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
    this.graderService = new ResponseGraderService(supabase, orgId);
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
      responseGuidelines:
        'Begin with a greeting, acknowledge the issue, provide clear next steps or solutions, and end with a professional closing.',
      complianceRequirements:
        'Include data privacy disclaimer when discussing sensitive information. Never share customer data or internal system details.',
    };

    const settings = data.settings as any;
    const orgSettings = settings?.autoResponse || {};

    // Merge with defaults, using org settings when available
    return {
      enabled: orgSettings.enabled ?? defaultSettings.enabled,
      tone: orgSettings.tone || defaultSettings.tone,
      language: orgSettings.language || defaultSettings.language,
      responseGuidelines:
        orgSettings.responseGuidelines || defaultSettings.responseGuidelines,
      complianceRequirements:
        orgSettings.complianceRequirements ||
        defaultSettings.complianceRequirements,
    };
  }

  // Make these methods public for shared data access
  async getRelevantContext(ticketId: string, thread?: EmailThread) {
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
      return {
        notes: notes || [],
        articleChunks: [],
      };
    }

    // Use thread messages for semantic search
    // Combine the last few messages to create a meaningful search context
    const messages = thread.messages.slice(-2); // Use last 2 messages
    const searchTexts = messages
      .map((msg) => msg.text_body)
      .filter(Boolean) as string[];

    if (!searchTexts.length) {
      return {
        notes: [],
        articleChunks: [],
      };
    }

    // Get semantically similar notes and article chunks
    const [notes, articleChunks] = await Promise.all([
      getSemanticallySimilarNotes(this.embeddings, searchTexts, {
        threshold: 0.5,
      }),
      getSemanticallySimilarArticleChunks(
        this.supabase,
        this.orgId,
        searchTexts,
        {
          threshold: 0.5,
        }
      ),
    ]);

    console.log('notes', notes);
    console.log('articleChunks', articleChunks);

    return {
      notes: notes || [],
      articleChunks: articleChunks || [],
    };
  }

  private formatThreadForResponse(thread: EmailThread) {
    return (thread.messages || [])
      .map((msg) => {
        const sender = msg.from_name || msg.from_email;
        const timestamp = msg.created_at
          ? new Date(msg.created_at).toISOString()
          : new Date().toISOString();
        return `[${timestamp}] ${sender}:\n${msg.text_body}\n`;
      })
      .join('\n---\n');
  }

  private formatContextForResponse(
    notes: Array<{
      id?: string;
      entity_type?: string;
      entity_id?: string;
      content: string;
      created_at?: string;
      similarity?: number;
    }> | null,
    articleChunks: Array<{
      chunk_id: string;
      article_id: string;
      article_title: string;
      chunk_content: string;
      chunk_index: number;
      similarity: number;
    }> | null
  ) {
    const formattedNotes = notes?.length
      ? notes
          .map((note) => {
            const timestamp = note.created_at
              ? new Date(note.created_at).toISOString()
              : new Date().toISOString();
            return `<note>\n[Note ${timestamp}]\n${note.content}\n</note>`;
          })
          .join('\n\n')
      : 'No relevant notes found.';

    const formattedArticles = articleChunks?.length
      ? articleChunks
          .map(
            (chunk) =>
              `<article>\n[Article: ${chunk.article_title}]\n${chunk.chunk_content}\n</article>`
          )
          .join('\n\n')
      : 'No relevant articles found.';

    return `Notes:\n${formattedNotes}\n\nKnowledge Base Articles:\n${formattedArticles}`;
  }

  async generateDraftResponse(
    thread: EmailThread,
    ticketId: string,
    options?: {
      context?: {
        notes: Array<{
          id?: string;
          entity_type?: string;
          entity_id?: string;
          content: string;
          created_at?: string;
          similarity?: number;
        }>;
        articleChunks: Array<{
          chunk_id: string;
          article_id: string;
          article_title: string;
          chunk_content: string;
          chunk_index: number;
          similarity: number;
        }>;
      };
      settings?: AutoResponseSettings;
    }
  ): Promise<string | null> {
    if (!thread || !thread.messages || !thread.messages.length) {
      throw new Error('Thread not found or empty');
    }

    // Get auto-response settings
    const settings =
      options?.settings || (await this.getAutoResponseSettings());

    // Check if auto-response is enabled
    if (!settings.enabled) {
      return null;
    }

    // Get relevant context if not provided
    const context =
      options?.context || (await this.getRelevantContext(ticketId, thread));

    // Format all context for the prompt
    const threadText = this.formatThreadForResponse(thread);
    const contextText = this.formatContextForResponse(
      context.notes,
      context.articleChunks
    );

    // Generate response using LangChain
    const chain = this.responderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const draftResponse = await chain.invoke({
      thread: threadText,
      relevantNotes: contextText,
      tone: settings.tone,
      language: settings.language,
      responseGuidelines: settings.responseGuidelines,
      complianceRequirements: settings.complianceRequirements,
    });

    // Grade the response
    const grade = await this.graderService.gradeResponse(
      thread.id,
      draftResponse,
      {
        thread,
        context,
      }
    );

    // Store the draft and grade
    const { error } = await this.supabase.from('response_drafts').insert({
      org_id: this.orgId,
      thread_id: thread.id,
      ticket_id: ticketId,
      content: draftResponse,
      grade,
      status: 'pending',
      metadata: {
        context_used: {
          had_notes: context.notes.length > 0,
          had_articles: context.articleChunks.length > 0,
          message_count: thread.messages.length,
        },
      },
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
        approved_by: userId,
      })
      .eq('id', draftId);

    if (error) throw error;
  }

  async modifyDraft(
    draftId: string,
    modifiedContent: string,
    feedback?: string
  ) {
    const { error } = await this.supabase
      .from('response_drafts')
      .update({
        status: 'modified',
        modified_content: modifiedContent,
        feedback,
      })
      .eq('id', draftId);

    if (error) throw error;
  }

  async rejectDraft(draftId: string, feedback: string) {
    const { error } = await this.supabase
      .from('response_drafts')
      .update({
        status: 'rejected',
        feedback,
      })
      .eq('id', draftId);

    if (error) throw error;
  }
}
