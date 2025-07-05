'use server';
/**
 * @fileOverview A game generator AI agent.
 *
 * - generateGame - A function that handles the game generation process.
 * - GenerateGameInput - The input type for the generateGame function.
 * - GenerateGameOutput - The return type for the generateGame function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGameInputSchema = z.object({
  topic: z.string().describe('The topic of the game or quiz.'),
  grade: z.number().describe('The grade level for the game or quiz.'),
});
export type GenerateGameInput = z.infer<typeof GenerateGameInputSchema>;

const GameQuestionSchema = z.object({
    questionText: z.string().describe('The text of the question.'),
    options: z.array(z.string()).min(4).max(4).describe('An array of 4 possible answers.'),
    correctAnswerIndex: z.number().describe('The 0-based index of the correct answer in the options array.'),
    imagePrompt: z.string().optional().describe('An optional simple prompt for an image related to the question. e.g. "A map of India".'),
});

const GenerateGameOutputSchema = z.object({
    title: z.string().describe('A catchy, gamer-oriented title for the quiz game.'),
    theme: z.string().describe('A fun theme for the game, like "Jungle Quest" or "Space Adventure".'),
    instructions: z.string().describe('Simple instructions for how to play the game.'),
    questions: z.array(GameQuestionSchema).min(5).describe('An array of at least 5 quiz questions.'),
});
export type GenerateGameOutput = z.infer<typeof GenerateGameOutputSchema>;

export async function generateGame(input: GenerateGameInput): Promise<GenerateGameOutput> {
  return generateGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGamePrompt',
  input: {schema: GenerateGameInputSchema},
  output: {schema: GenerateGameOutputSchema},
  prompt: `You are an AI game designer who creates fun, engaging, gamer-oriented quizzes for students.
  
Create a quiz game based on the topic and grade level provided. The game should have a catchy title, a fun theme, simple instructions, and at least 5 multiple-choice questions. Each question must have exactly 4 options. Make the questions and title engaging and fun for a young gamer audience.

Topic: {{{topic}}}
Grade Level: {{{grade}}}

Please return the game in the specified JSON format.`,
});

const generateGameFlow = ai.defineFlow(
  {
    name: 'generateGameFlow',
    inputSchema: GenerateGameInputSchema,
    outputSchema: GenerateGameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
