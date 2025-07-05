'use server';
/**
 * @fileOverview A flashcard generator AI agent.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  topic: z.string().describe('The topic for the flashcards.'),
  grade: z.string().describe('The grade level for the flashcards.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
    term: z.string().describe('A key term or concept related to the topic.'),
    definition: z.string().describe('A simple, grade-appropriate definition of the term.'),
    imagePrompt: z.string().describe('A simple DALL-E style prompt for an image that visually represents the term. E.g., "A cartoon drawing of a happy sun".'),
});

const GenerateFlashcardsOutputSchema = z.object({
  cards: z.array(FlashcardSchema).describe('An array of flashcard objects.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an AI that creates educational flashcards for students. Generate a set of 8 flashcards for the given topic and grade level. Each flashcard should have a term, a simple definition suitable for the grade level, and a simple prompt to generate a helpful image.

Topic: {{{topic}}}
Grade Level: {{{grade}}}

Generate 8 flashcards.`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
