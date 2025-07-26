'use server';
/**
 * @fileOverview A flashcard generator AI agent.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - generateFlashcardImage - A function that handles generating an image for a single flashcard.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 * - GenerateFlashcardImageInput - The input type for the generateFlashcardImage function.
 * - GenerateFlashcardImageOutput - The return type for the generateFlashcardImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas and flow for generating flashcard text content
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


// Schemas and flow for generating a single flashcard image
const GenerateFlashcardImageInputSchema = z.object({
  imagePrompt: z.string().describe('The prompt for the image to be generated.'),
});
export type GenerateFlashcardImageInput = z.infer<typeof GenerateFlashcardImageInputSchema>;

const GenerateFlashcardImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateFlashcardImageOutput = z.infer<typeof GenerateFlashcardImageOutputSchema>;

export async function generateFlashcardImage(input: GenerateFlashcardImageInput): Promise<GenerateFlashcardImageOutput> {
    return generateFlashcardImageFlow(input);
}

const generateFlashcardImageFlow = ai.defineFlow(
    {
        name: 'generateFlashcardImageFlow',
        inputSchema: GenerateFlashcardImageInputSchema,
        outputSchema: GenerateFlashcardImageOutputSchema,
    },
    async ({ imagePrompt }) => {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `A simple, clear, child-friendly cartoon icon of: ${imagePrompt}`,
            config: { responseModalities: ['TEXT', 'IMAGE'] },
        });

        if (!media?.url) {
            throw new Error('Image generation failed to return a data URL.');
        }

        return { imageUrl: media.url };
    }
);
