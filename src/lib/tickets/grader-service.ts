import { SupabaseClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { Database } from '@/lib/database.types';
import { EmailThread } from '../email/types';

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

Organization Settings and Guidelines:
<org_settings>
{orgSettings}
</org_settings>

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
  "concerns": ["<concern1>", "<concern2>"] // List ONLY if accuracy_score <= 3, otherwise empty array
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

  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // Do not change this
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.graderPrompt = PromptTemplate.fromTemplate(GRADER_PROMPT);
  }

  private async getEmailThread(threadId: string) {
    const { data: thread, error } = await this.supabase
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
      .eq('id', threadId)
      .order('created_at', { ascending: true })
      .single();

    if (error) throw error;
    return thread;
  }

  private async getRelevantContext(ticketId: string) {
    // First get the contact_id for the ticket
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

  private async getOrgSettings() {
    // TODO: Implement knowledge base and org settings retrieval
    // For now, return basic settings
    return {
      tone: 'professional and friendly',
      language: 'en',
      responseGuidelines: [
        'Always verify customer identity',
        'Provide clear next steps',
        'Include relevant documentation links'
      ],
      complianceRequirements: [
        'Do not share sensitive information',
        'Include required disclaimers',
        'Follow data protection guidelines'
      ]
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

  private formatContextForGrading(notes: any[]) {
    if (!notes?.length) return 'No relevant context found.';
    return notes
      .map(note => {
        const timestamp = new Date(note.created_at).toISOString();
        return `[${timestamp}] ${note.content}`;
      })
      .join('\n\n');
  }

  async gradeResponse(
    threadId: string,
    proposedResponse: string,
    options?: {
      thread?: EmailThread;
      context?: { content: string; created_at: string }[];
      orgSettings?: {
        tone: string;
        language: string;
        responseGuidelines: string[];
        complianceRequirements: string[];
      };
    }
  ): Promise<ResponseGrade> {
    // Get the thread if not provided
    const thread = options?.thread || await this.getEmailThread(threadId);
    if (!thread || !thread.messages || !thread.messages.length) {
      throw new Error('Thread not found or empty');
    }

    // Get additional context using the thread's ticket_id if not provided
    const [context, orgSettings] = await Promise.all([
      options?.context || this.getRelevantContext(thread.ticket_id),
      options?.orgSettings || this.getOrgSettings(),
    ]);

    // Format all context for grading
    const threadText = this.formatThreadForGrading(thread);
    const contextText = this.formatContextForGrading(context);
    const settingsText = JSON.stringify(orgSettings, null, 2);

    // Generate grade using LangChain
    const chain = this.graderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const result = await chain.invoke({
      thread: threadText,
      response: proposedResponse,
      context: contextText,
      orgSettings: settingsText,
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