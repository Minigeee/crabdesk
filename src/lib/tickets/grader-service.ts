import { SupabaseClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { Database } from '@/lib/database.types';
import { EmailThread } from '../email/types';
import { getEmailThread, getSemanticallySimilarNotes, getSemanticallySimilarArticleChunks } from './utils';
import { EmbeddingService } from '../embeddings/service';
import type { GraderSettings, OrganizationSettings } from '@/lib/settings/types';

const DEFAULT_GRADER_SETTINGS: GraderSettings = {
  enabled: true,
  qualityGuidelines: `
    1. Professional tone and language
    2. Clear and concise communication
    3. Proper grammar and formatting
    4. Appropriate level of detail
    5. Positive and helpful attitude`,
  accuracyGuidelines: `
    1. Information matches knowledge base
    2. Follows organization policies
    3. Uses correct technical terminology
    4. Provides accurate solutions
    5. Avoids assumptions`
};

const GRADER_PROMPT = `You are an expert customer support quality analyst. Your task is to quickly assess a customer support response on two key factors:

1. Overall Quality (How well-written and professional is the response?)
   1 - Bad: Unprofessional, unclear, or incomplete
   2 - Poor: Multiple issues with clarity or professionalism
   3 - Acceptable: Gets the job done but could be better
   4 - Good: Clear, professional, and complete
   5 - Great: Exceptional in clarity and professionalism

2. Accuracy & Alignment (Does it use correct information and follow org guidelines?)
   1 - Bad: Contains incorrect information or violates guidelines
   2 - Poor: Makes assumptions or doesn't align well with org tone
   3 - Acceptable: Mostly accurate but could be more aligned
   4 - Good: Accurate and well-aligned with guidelines
   5 - Great: Perfect accuracy and alignment with org values

Organization Grading Guidelines:
<grading_guidelines>
Quality Guidelines:
{qualityGuidelines}

Accuracy Guidelines:
{accuracyGuidelines}
</grading_guidelines>

Relevant Context and Notes:
<context>
{context}
</context>

Original Thread:
<thread>
{thread}
</thread>

Proposed Response:
<response>
{response}
</response>

Provide your assessment as a JSON object with the following format:
{{
  "quality_score": <number 1-5>,
  "accuracy_score": <number 1-5>,
  "summary": "<one-line explanation>",
  "concerns": ["<concern1>", "<concern2>"] // List ONLY if accuracy_score <= 3 or quality_score <= 3, otherwise empty array
}}

Respond with ONLY the JSON object and nothing else.`;

const gradeSchema = z.object({
  quality_score: z.number().min(1).max(5),
  accuracy_score: z.number().min(1).max(5),
  summary: z.string(),
  concerns: z.array(z.string())
});

export type ResponseGrade = z.infer<typeof gradeSchema>;

export class ResponseGraderService {
  private readonly llm: ChatOpenAI;
  private readonly graderPrompt: PromptTemplate;
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

    this.graderPrompt = PromptTemplate.fromTemplate(GRADER_PROMPT);
    this.embeddings = new EmbeddingService(supabase, orgId);
  }

  private async getRelevantContext(ticketId: string, thread: EmailThread, proposedResponse: string) {
    // Get the latest message and proposed response for semantic search
    const messages = thread.messages || [];
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage?.text_body) {
      return {
        notes: [],
        articleChunks: []
      };
    }

    const searchTexts = [latestMessage.text_body, proposedResponse].filter(Boolean) as string[];

    // Get semantically similar notes and article chunks in parallel
    const [notes, articleChunks] = await Promise.all([
      getSemanticallySimilarNotes(this.embeddings, searchTexts),
      getSemanticallySimilarArticleChunks(this.supabase, this.orgId, searchTexts)
    ]);

    return {
      notes,
      articleChunks
    };
  }

  private async getOrgSettings() {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('settings')
      .eq('id', this.orgId)
      .single();

    if (error) {
      console.error('Failed to fetch organization settings:', error);
      return DEFAULT_GRADER_SETTINGS;
    }

    const settings = data?.settings as OrganizationSettings;
    const graderSettings = settings?.grader || {};

    // Merge with defaults, using org settings when available
    return {
      enabled: graderSettings.enabled ?? DEFAULT_GRADER_SETTINGS.enabled,
      qualityGuidelines: graderSettings.qualityGuidelines || DEFAULT_GRADER_SETTINGS.qualityGuidelines,
      accuracyGuidelines: graderSettings.accuracyGuidelines || DEFAULT_GRADER_SETTINGS.accuracyGuidelines,
      minimumQualityScore: graderSettings.minimumQualityScore ?? DEFAULT_GRADER_SETTINGS.minimumQualityScore,
      minimumAccuracyScore: graderSettings.minimumAccuracyScore ?? DEFAULT_GRADER_SETTINGS.minimumAccuracyScore,
    };
  }

  private formatThreadForGrading(thread: any) {
    return thread.messages
      .map((msg: any) => {
        const sender = msg.from_name || msg.from_email;
        const timestamp = new Date(msg.created_at).toISOString();
        return `[${timestamp}] ${sender}:\n${msg.text_body}\n`;
      })
      .join('\n---\n');
  }

  private formatContextForGrading(
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
          .map(note => {
            const timestamp = note.created_at ? new Date(note.created_at).toISOString() : new Date().toISOString();
            return `<note>\n[Note ${timestamp}]\n${note.content}\n</note>`;
          })
          .join('\n\n')
      : 'No relevant notes found.';

    const formattedArticles = articleChunks?.length
      ? articleChunks
          .map(chunk => `<article>\n[Article: ${chunk.article_title}]\n${chunk.chunk_content}\n</article>`)
          .join('\n\n')
      : 'No relevant articles found.';

    return `Notes:\n${formattedNotes}\n\nKnowledge Base Articles:\n${formattedArticles}`;
  }

  async gradeResponse(
    threadId: string,
    proposedResponse: string,
    options?: {
      thread?: EmailThread;
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
      orgSettings?: GraderSettings;
    }
  ): Promise<ResponseGrade> {
    // Get the thread if not provided
    const thread = options?.thread || await getEmailThread(this.supabase, threadId);
    if (!thread || !thread.messages || !thread.messages.length) {
      throw new Error('Thread not found or empty');
    }

    // Get additional context using semantic search if not provided
    const context = options?.context || await this.getRelevantContext(thread.ticket_id, thread, proposedResponse);

    // Get org settings
    const orgSettings = options?.orgSettings || await this.getOrgSettings();

    // Check if grading is enabled
    if (orgSettings.enabled === false) {
      // Return maximum scores if grading is disabled
      return {
        quality_score: 5,
        accuracy_score: 5,
        summary: "Grading disabled - automatic approval",
        concerns: []
      };
    }

    // Format all context for grading
    const threadText = this.formatThreadForGrading(thread);
    const contextText = this.formatContextForGrading(context.notes, context.articleChunks);

    // Generate grade using LangChain
    const chain = this.graderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const result = await chain.invoke({
      thread: threadText,
      response: proposedResponse,
      context: contextText,
      qualityGuidelines: orgSettings.qualityGuidelines,
      accuracyGuidelines: orgSettings.accuracyGuidelines,
      minimumQualityScore: orgSettings.minimumQualityScore,
      minimumAccuracyScore: orgSettings.minimumAccuracyScore,
    });

    // Parse and validate the grade
    try {
      const gradeResult = JSON.parse(result);
      return gradeSchema.parse(gradeResult);
    } catch (error) {
      console.error('Failed to parse grade result:', error);
      throw new Error('Failed to grade response');
    }
  }
} 