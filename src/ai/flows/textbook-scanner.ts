// src/ai/flows/textbook-scanner.ts
'use server';

/**
 * @fileOverview Textbook Scanner flow that extracts text from images and generates questions.
 *
 * - textbookScanner - A function that handles the textbook scanning and question generation process.
 * - TextbookScannerInput - The input type for the textbookScanner function.
 * - TextbookScannerOutput - The return type for the textbookScanner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextbookScannerInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a textbook, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  gradeLevel: z.string().describe('The grade level of the textbook content.'),
});
export type TextbookScannerInput = z.infer<typeof TextbookScannerInputSchema>;

const TextbookScannerOutputSchema = z.object({
  mcqQuestions: z.array(z.string()).describe('Multiple choice questions generated from the text.'),
  fillInTheBlankQuestions: z
    .array(z.string())
    .describe('Fill in the blank questions generated from the text.'),
  matchTheColumnQuestions: z
    .array(z.string())
    .describe('Match the column questions generated from the text.'),
});
export type TextbookScannerOutput = z.infer<typeof TextbookScannerOutputSchema>;

export async function textbookScanner(input: TextbookScannerInput): Promise<TextbookScannerOutput> {
  return textbookScannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textbookScannerPrompt',
  input: {schema: TextbookScannerInputSchema},
  output: {schema: TextbookScannerOutputSchema},
  prompt: `You are a teacher's assistant that helps generate questions from textbook images.

  Generate multiple choice, fill in the blank, and match the column questions based on the textbook content in the image provided.
  The textbook is for grade level: {{{gradeLevel}}}

  Image:
  {{media url=photoDataUri}}
  `,
});

const textbookScannerFlow = ai.defineFlow(
  {
    name: 'textbookScannerFlow',
    inputSchema: TextbookScannerInputSchema,
    outputSchema: TextbookScannerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
