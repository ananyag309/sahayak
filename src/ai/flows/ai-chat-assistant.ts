'use server';

/**
 * @fileOverview An AI Chat Assistant that generates stories, analogies, or explanations for concepts, with support for image and voice input.
 *
 * - aiChat - A function that handles the AI chat process.
 * - AIChatInput - The input type for the aiChat function.
 * - AIChatOutput - The return type for the aiChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatInputSchema = z.object({
  question: z.string().optional().describe('The question or concept to explain.'),
  language: z.enum(['en', 'hi', 'mr', 'ta', 'bn', 'te', 'kn', 'gu', 'pa', 'es', 'fr', 'de']).describe('The language to use for the response.'),
  imageDataUri: z.string().optional().describe("An optional image to discuss, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
}).superRefine((data, ctx) => {
    if (!data.question && !data.imageDataUri) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A question or an image must be provided.",
        });
    }
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

Your response should always be in the language requested by the user.

{{#if imageDataUri}}
Analyze the following image. The user may ask a question about it, or they may just want you to describe it.
If there is a question, answer it based on the image.
If there is no question, create a simple explanation, story, or description of what is happening in theimage.
Image: {{media url=imageDataUri}}
{{/if}}

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
