'use server';
/**
 * @fileOverview A homework sheet generator AI agent.
 *
 * - generateHomework - A function that handles the homework generation process.
 * - GenerateHomeworkInput - The input type for the generateHomework function.
 * - GenerateHomeworkOutput - The return type for the generateHomework function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHomeworkInputSchema = z.object({
  topic: z.string().describe('The topic for the homework sheet.'),
  grade: z.string().describe('The grade level for the homework.'),
  language: z.enum(['en', 'hi', 'mr', 'ta']).describe('The language for the homework sheet.'),
});
export type GenerateHomeworkInput = z.infer<typeof GenerateHomeworkInputSchema>;

const QuestionSchema = z.object({
    questionNumber: z.number().describe('The question number.'),
    questionText: z.string().describe('The full text of the question.'),
});

const AnswerSchema = z.object({
    questionNumber: z.number().describe('The corresponding question number.'),
    answerText: z.string().describe('The detailed answer for the question.'),
});

const GenerateHomeworkOutputSchema = z.object({
  title: z.string().describe('A suitable title for the homework sheet.'),
  instructions: z.string().describe('Brief instructions for the student.'),
  questions: z.array(QuestionSchema).length(5).describe('An array of exactly 5 mixed-type questions (e.g., MCQ, short answer, fill-in-the-blank).'),
  answerKey: z.array(AnswerSchema).length(5).describe('A corresponding array of 5 detailed answers for the answer key.'),
});
export type GenerateHomeworkOutput = z.infer<typeof GenerateHomeworkOutputSchema>;

export async function generateHomework(input: GenerateHomeworkInput): Promise<GenerateHomeworkOutput> {
  return generateHomeworkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHomeworkPrompt',
  input: {schema: GenerateHomeworkInputSchema},
  output: {schema: GenerateHomeworkOutputSchema},
  prompt: `You are an expert teacher creating a homework assignment. Generate a homework sheet based on the provided topic, grade, and language.

The worksheet must contain exactly 5 questions of mixed types (e.g., multiple-choice, fill-in-the-blank, short answer).
You must also provide a complete and detailed answer key for all 5 questions.
The entire output (title, instructions, questions, and answers) must be in the specified language.

Topic: {{{topic}}}
Grade: {{{grade}}}
Language: {{{language}}}
`,
});

const generateHomeworkFlow = ai.defineFlow(
  {
    name: 'generateHomeworkFlow',
    inputSchema: GenerateHomeworkInputSchema,
    outputSchema: GenerateHomeworkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
