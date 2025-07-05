// src/ai/flows/lesson-planner.ts
'use server';
/**
 * @fileOverview A lesson planner AI agent.
 *
 * - generateLessonPlan - A function that handles the lesson plan generation process.
 * - LessonPlanInput - The input type for the generateLessonPlan function.
 * - LessonPlanOutput - The return type for the generateLessonPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LessonPlanInputSchema = z.object({
  subject: z.string().describe('The subject of the lesson plan.'),
  grade: z.string().describe('The grade level of the lesson plan.'),
  topics: z.string().describe('The topics to be covered in the lesson plan.'),
});
export type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>;

const LessonPlanOutputSchema = z.object({
  weeklyPlan: z.string().describe('A weekly lesson plan with topics, activities, and materials needed.'),
});
export type LessonPlanOutput = z.infer<typeof LessonPlanOutputSchema>;

export async function generateLessonPlan(input: LessonPlanInput): Promise<LessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lessonPlanPrompt',
  input: {schema: LessonPlanInputSchema},
  output: {schema: LessonPlanOutputSchema},
  prompt: `You are an expert teacher specializing in creating weekly lesson plans.

You will use this information to create a detailed weekly lesson plan with topics, activities, and materials needed.

Subject: {{{subject}}}
Grade: {{{grade}}}
Topics: {{{topics}}}`,
});

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: LessonPlanInputSchema,
    outputSchema: LessonPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
