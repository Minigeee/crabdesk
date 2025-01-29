import { SupabaseClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { Database } from '@/lib/database.types';

const GRADER_PROMPT = `You are an expert customer support quality analyst. Your task is to grade a customer support response based on several key factors:

1. Clarity and Professionalism
2. Completeness of Response
3. Empathy and Tone
4. Technical Accuracy
5. Solution-Oriented Approach

Below is the original email thread and the proposed response. Grade the response on a scale from 1 to 5:
1 - Bad: Response is inadequate, unprofessional, or incorrect
2 - Poor: Response needs significant improvement
3 - Acceptable: Response is adequate but could be better
4 - Good: Response is well-crafted and effective
5 - Great: Response is exceptional in all aspects

Original Thread:
<thread>
{thread}
</thread>

Proposed Response:
<response>
{response}
</response>

Provide your grade as a JSON object with the following format:
{{
  "grade": <number 1-5>,
  "summary": "<brief explanation of grade>",
  "strengths": ["<strength1>", "<strength2>", ...],
  "improvements": ["<improvement1>", "<improvement2>", ...]
}}

Respond with ONLY the JSON object and nothing else.`;

const gradeSchema = z.object({
  grade: z.number().min(1).max(5),
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string())
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

  private formatThreadForGrading(thread: any) {
    return thread.messages
      .map((msg: any) => {
        const sender = msg.from_name || msg.from_email;
        const timestamp = new Date(msg.created_at).toISOString();
        return `[${timestamp}] ${sender}:\n${msg.text_body}\n`;
      })
      .join('\n---\n');
  }

  async gradeResponse(threadId: string, proposedResponse: string): Promise<ResponseGrade> {
    // Get the email thread and messages
    const thread = await this.getEmailThread(threadId);
    if (!thread || !thread.messages.length) {
      throw new Error('Thread not found or empty');
    }

    // Format thread for grading
    const threadText = this.formatThreadForGrading(thread);

    // Generate grade using LangChain
    const chain = this.graderPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    const result = await chain.invoke({
      thread: threadText,
      response: proposedResponse,
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