// src/ai/flows/textbook-scanner.ts
'use server';

/**
 * @fileOverview Textbook Scanner flow that extracts text from images, auto-identifies the grade level, and generates curriculum-aligned questions.
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
  language: z.enum(['en', 'hi', 'mr', 'ta', 'bn', 'te', 'kn', 'gu', 'pa', 'es', 'fr', 'de']).describe('The language of the textbook content.'),
  curriculum: z.string().describe('The educational board, e.g., "NCERT".'),
});
export type TextbookScannerInput = z.infer<typeof TextbookScannerInputSchema>;

const MatchPairSchema = z.object({
    term: z.string().describe("The term or item for the first column."),
    definition: z.string().describe("The corresponding definition or item for the second column."),
});

const TextbookScannerOutputSchema = z.object({
  identifiedGradeLevel: z.string().describe('The grade level identified by the AI from the textbook content.'),
  learningObjectives: z.string().describe('The key learning objectives covered in this worksheet, aligned with the curriculum.'),
  subTopic: z.string().describe('The specific sub-topic from the curriculum that the worksheet addresses.'),
  mcqQuestions: z.array(z.string()).describe('A list of multiple choice questions based on the text.'),
  fillInTheBlankQuestions: z
    .array(z.string())
    .describe('A list of fill-in-the-blank questions. Use underscores `___` for the blank part.'),
  shortAnswerQuestions: z.array(z.string()).describe("A list of short answer questions that require a brief written response."),
  matchTheColumnQuestions: z.array(MatchPairSchema).describe('An array of objects for a matching exercise, where each object has a "term" and a corresponding "definition".'),
});
export type TextbookScannerOutput = z.infer<typeof TextbookScannerOutputSchema>;

export async function textbookScanner(input: TextbookScannerInput): Promise<TextbookScannerOutput> {
  return textbookScannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textbookScannerPrompt',
  input: {schema: TextbookScannerInputSchema},
  output: {schema: TextbookScannerOutputSchema},
  prompt: `You are a teacher's assistant that helps generate questions from textbook images, strictly aligned with a specified curriculum. The questions you generate MUST be in the requested language.

  Analyze the content from the image provided. Your first task is to determine the most appropriate grade level for this content.

  Based on the grade level you identify, generate a comprehensive worksheet suitable for that grade and the specified curriculum.

  First, identify the specific sub-topic and the key learning objectives this content covers according to the curriculum.

  Then, create at least 2-3 questions for each category if the text allows.
  
  1.  **Multiple Choice Questions:** Create several multiple-choice questions.
  2.  **Fill in the Blank:** Create several fill-in-the-blank sentences. Use underscores like \`___\` to indicate the blank.
  3.  **Short Answer Questions:** Create a few questions that require a brief written response (1-2 sentences).
  4.  **Match the Column:** Create several pairs of terms and their corresponding definitions. Format this as an array of objects, with each object having a 'term' key and a 'definition' key.

  The questions must be based *only* on the text visible in the image and must align with the learning standards of the provided curriculum.

  Curriculum: {{{curriculum}}}
  Language: {{{language}}}
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
    if (!output) {
      throw new Error("The AI failed to generate questions from the provided image.");
    }
    return output;
  }
);
