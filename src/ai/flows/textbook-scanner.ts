
// src/ai/flows/textbook-scanner.ts
'use server';

/**
 * @fileOverview Textbook Scanner flow that extracts text from images, identifies the language and grade level, and generates curriculum-aligned questions in the identified language.
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
});
export type TextbookScannerInput = z.infer<typeof TextbookScannerInputSchema>;

const MatchPairSchema = z.object({
    term: z.string().describe("The term or item for the first column."),
    definition: z.string().describe("The corresponding definition or item for the second column."),
});

const TextbookScannerOutputSchema = z.object({
  identifiedLanguage: z.string().describe('The primary language identified from the text in the image (e.g., "Hindi", "English", "Tamil").'),
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
  prompt: `You are an expert teacher's assistant specializing in creating worksheets from textbook images for various Indian curriculums.

  **CRITICAL INSTRUCTIONS:**
  1.  **Analyze the Image:** First, carefully analyze the provided image to identify the primary language of the text.
  2.  **Identify Grade Level:** Determine the most appropriate grade level for the content.
  3.  **Generate in Detected Language:** You MUST generate the entire worksheet (learning objectives, sub-topic, and ALL questions) in the SAME language you detected from the image.
  4.  **Strict JSON Output:** The final output MUST be a valid JSON object matching the provided schema. Do not include any text or formatting outside of the JSON structure.

  **WORKSHEET CONTENT REQUIREMENTS:**
  -   **identifiedLanguage:** The language you detected (e.g., "Hindi", "English").
  -   **identifiedGradeLevel:** The grade level you detected.
  -   **learningObjectives:** State the key learning objectives.
  -   **subTopic:** Identify the specific sub-topic.
  -   **Question Types:** If the text allows, create 2-3 questions for each category: Multiple Choice, Fill in the Blank (use '___' for blanks), Short Answer, and Match the Column.

  Curriculum: {{{curriculum}}}
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
      throw new Error("The AI failed to generate questions from the provided image. The image may be unclear or the content too complex.");
    }
    return output;
  }
);
