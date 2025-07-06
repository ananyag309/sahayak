'use server';
/**
 * @fileOverview AI agents for generating homework sheets and corresponding answer keys.
 *
 * - generateHomeworkSheet - Generates the student-facing worksheet.
 * - generateAnswerKey - Generates the answer key for a given set of questions.
 * - GenerateHomeworkSheetInput - Input for the worksheet generator.
 * - GenerateHomeworkSheetOutput - Output for the worksheet generator.
 * - GenerateAnswerKeyInput - Input for the answer key generator.
 * - GenerateAnswerKeyOutput - Output for the answer key generator.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for generating the worksheet
const GenerateHomeworkSheetInputSchema = z.object({
  topic: z.string().describe('The topic for the homework sheet.'),
  grade: z.string().describe('The grade level for the homework.'),
  language: z.enum(['en', 'hi', 'mr', 'ta']).describe('The language for the homework sheet.'),
});
export type GenerateHomeworkSheetInput = z.infer<typeof GenerateHomeworkSheetInputSchema>;

const QuestionSchema = z.object({
    questionNumber: z.number().describe('The question number, starting from 1.'),
    questionText: z.string().describe('The full text of the question.'),
});

const GenerateHomeworkSheetOutputSchema = z.object({
  title: z.string().describe('A suitable title for the homework sheet.'),
  instructions: z.string().describe('Brief instructions for the student.'),
  questions: z.array(QuestionSchema).min(3).max(7).describe('An array of 3 to 7 mixed-type questions (e.g., MCQ, short answer, fill-in-the-blank).'),
});
export type GenerateHomeworkSheetOutput = z.infer<typeof GenerateHomeworkSheetOutputSchema>;


// Schema for generating the answer key
const GenerateAnswerKeyInputSchema = z.object({
    questions: z.array(QuestionSchema).describe('The array of questions for which to generate an answer key.'),
    language: z.enum(['en', 'hi', 'mr', 'ta']).describe('The language for the answer key.'),
});
export type GenerateAnswerKeyInput = z.infer<typeof GenerateAnswerKeyInputSchema>;

const AnswerSchema = z.object({
    questionNumber: z.number().describe('The corresponding question number.'),
    answerText: z.string().describe('The detailed answer for the question.'),
});

const GenerateAnswerKeyOutputSchema = z.object({
  answerKey: z.array(AnswerSchema).describe('A corresponding array of detailed answers for the answer key.'),
});
export type GenerateAnswerKeyOutput = z.infer<typeof GenerateAnswerKeyOutputSchema>;


// Flow 1: Generate Homework Sheet
export async function generateHomeworkSheet(input: GenerateHomeworkSheetInput): Promise<GenerateHomeworkSheetOutput> {
  return generateHomeworkSheetFlow(input);
}

const homeworkSheetPrompt = ai.definePrompt({
  name: 'generateHomeworkSheetPrompt',
  input: {schema: GenerateHomeworkSheetInputSchema},
  output: {schema: GenerateHomeworkSheetOutputSchema},
  prompt: `You are an expert teacher creating a homework assignment for students. Generate a worksheet based on the provided topic, grade, and language.

The worksheet must contain a title, instructions, and between 3 and 7 questions of mixed types (e.g., multiple-choice, fill-in-the-blank, short answer).
The entire output (title, instructions, and questions) must be in the specified language.
DO NOT generate the answers. Only generate the student-facing worksheet.

Topic: {{{topic}}}
Grade: {{{grade}}}
Language: {{{language}}}
`,
});

const generateHomeworkSheetFlow = ai.defineFlow(
  {
    name: 'generateHomeworkSheetFlow',
    inputSchema: GenerateHomeworkSheetInputSchema,
    outputSchema: GenerateHomeworkSheetOutputSchema,
  },
  async input => {
    const {output} = await homeworkSheetPrompt(input);
    return output!;
  }
);


// Flow 2: Generate Answer Key
export async function generateAnswerKey(input: GenerateAnswerKeyInput): Promise<GenerateAnswerKeyOutput> {
    return generateAnswerKeyFlow(input);
}

const answerKeyPrompt = ai.definePrompt({
    name: 'generateAnswerKeyPrompt',
    input: {schema: GenerateAnswerKeyInputSchema},
    output: {schema: GenerateAnswerKeyOutputSchema},
    prompt: `You are an expert teacher creating an answer key for a homework assignment.
    
    For each of the following questions, provide a clear and detailed answer. Ensure the answer key is in the specified language.
    The output must contain an 'answerKey' array with exactly one answer for each question provided.

    Language: {{{language}}}

    Questions:
    {{#each questions}}
    {{questionNumber}}. {{questionText}}
    {{/each}}
    `,
});

const generateAnswerKeyFlow = ai.defineFlow(
    {
        name: 'generateAnswerKeyFlow',
        inputSchema: GenerateAnswerKeyInputSchema,
        outputSchema: GenerateAnswerKeyOutputSchema,
    },
    async input => {
        const {output} = await answerKeyPrompt(input);
        return output!;
    }
);
