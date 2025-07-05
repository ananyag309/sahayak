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

const MatchPairSchema = z.object({
    term: z.string().describe("The term or item for the first column."),
    definition: z.string().describe("The corresponding definition or item for the second column."),
});

const TextbookScannerOutputSchema = z.object({
  mcqQuestions: z.array(z.string()).describe('A list of multiple choice questions based on the text.'),
  fillInTheBlankQuestions: z
    .array(z.string())
    .describe('A list of fill-in-the-blank questions. Use underscores `___` for the blank part.'),
  matchTheColumnQuestions: z.array(MatchPairSchema).describe('A list of term/definition pairs for a matching exercise.'),
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

  Analyze the content from the image provided. Based on the text, generate three types of questions suitable for the specified grade level.

  1.  **Multiple Choice Questions:** Create several multiple-choice questions.
  2.  **Fill in the Blank:** Create several fill-in-the-blank sentences. Use underscores like \`___\` to indicate the blank.
  3.  **Match the Column:** Create several pairs of terms and their corresponding definitions.

  The questions must be based *only* on the text visible in the image.

  Grade Level: {{{gradeLevel}}}
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
