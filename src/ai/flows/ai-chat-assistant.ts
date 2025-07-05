'use server';

/**
 * @fileOverview An AI Chat Assistant that generates stories, analogies, or explanations for concepts.
 *
 * - aiChat - A function that handles the AI chat process.
 * - AIChatInput - The input type for the aiChat function.
 * - AIChatOutput - The return type for the aiChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatInputSchema = z.object({
  question: z.string().describe('The question or concept to explain.'),
  language: z.enum(['en', 'hi', 'mr', 'ta']).describe('The language to use for the response.'),
});
export type AIChatInput = z.infer<typeof AIChatInputSchema>;

const AIChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated story, analogy, or explanation.'),
});
export type AIChatOutput = z.infer<typeof AIChatOutputSchema>;

export async function aiChat(input: AIChatInput): Promise<AIChatOutput> {
  return aiChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatPrompt',
  input: {schema: AIChatInputSchema},
  output: {schema: AIChatOutputSchema},
  prompt: `You are a multilingual teaching assistant, skilled at explaining concepts in a way that is easy for students to understand. You can provide stories, analogies, or simple explanations.

  The user will ask a question, and you should provide a helpful and engaging answer in the requested language.

  Language: {{{language}}}
  Question: {{{question}}}`,
});

const aiChatFlow = ai.defineFlow(
  {
    name: 'aiChatFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
