
// src/ai/flows/textbook-scanner.ts
'use server';

/**
 * @fileOverview Textbook Scanner flow that extracts text from images, identifies the grade level, and generates curriculum-aligned questions in English.
 *
 * - textbookScanner - A function that handles the textbook scanning and question generation process.
 * - TextbookScannerInput - The input type for the textbookScanner function.
 * - TextbookScannerOutput - The return type for the textbookScanner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TextbookScannerInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a textbook, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  curriculum: z.string().describe('The educational board, e.g., "NCERT".'),
  language: z.enum(['en', 'hi', 'mr', 'ta', 'bn', 'te', 'kn', 'gu', 'pa', 'es', 'fr', 'de']).optional().describe('The primary language of the text in the image. This helps with context.'),
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
  prompt: `You are a teacher's assistant that helps generate worksheets from textbook images. Your primary task is to create a well-structured worksheet based on the provided image and curriculum.

  Analyze the content from the image. The user has indicated the text is primarily in '{{language}}'.
  
  1.  **Determine the most appropriate grade level** for this content.
  2.  **Generate a comprehensive worksheet in ENGLISH.** The entire output, including objectives, topics, and all questions, MUST be in English.
  
  The worksheet must be based *only* on the text visible in the image and must align with the learning standards of the provided curriculum.
  
  **Worksheet Content Requirements (in ENGLISH):**
  -   **Learning Objectives:** State the key learning objectives.
  -   **Sub-Topic:** Identify the specific sub-topic from the curriculum.
  -   **Question Types:** Create at least 2-3 questions for each of the following categories if the text allows:
      -   Multiple Choice Questions
      -   Fill in the Blank (use underscores \`___\` for the blank)
      -   Short Answer Questions
      -   Match the Column (provide term/definition pairs)

  Curriculum: {{{curriculum}}}
  {{#if language}}Language of text in image: {{{language}}}{{/if}}
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
