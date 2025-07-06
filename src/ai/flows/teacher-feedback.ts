'use server';

/**
 * @fileOverview An AI agent that provides feedback on lesson plans.
 *
 * - getTeacherFeedback - A function that provides improvement suggestions for a lesson plan.
 * - TeacherFeedbackInput - The input type for the getTeacherFeedback function.
 * - TeacherFeedbackOutput - The return type for the getTeacherFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeacherFeedbackInputSchema = z.object({
  subject: z.string().describe('The subject of the lesson plan.'),
  grade: z.string().describe('The grade level of the lesson plan.'),
  topic: z.string().describe('The main topic of the lesson plan.'),
  lessonPlan: z.string().describe('The generated lesson plan to be reviewed.'),
});
export type TeacherFeedbackInput = z.infer<typeof TeacherFeedbackInputSchema>;

const TeacherFeedbackOutputSchema = z.object({
  tips: z.array(z.string()).length(3).describe('An array of exactly 3 concise, actionable tips to improve the lesson plan for student engagement.'),
});
export type TeacherFeedbackOutput = z.infer<typeof TeacherFeedbackOutputSchema>;

export async function getTeacherFeedback(input: TeacherFeedbackInput): Promise<TeacherFeedbackOutput> {
  return teacherFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'teacherFeedbackPrompt',
  input: {schema: TeacherFeedbackInputSchema},
  output: {schema: TeacherFeedbackOutputSchema},
  prompt: `You are an expert pedagogical coach. A teacher has just created a lesson plan. 
  
Review the following lesson plan and provide exactly 3 concise, actionable tips on how to improve student engagement. Focus on practical activities, questioning techniques, or ways to make the content more relatable for students of the specified grade level.

Subject: {{{subject}}}
Grade: {{{grade}}}
Topic: {{{topic}}}

Lesson Plan to Review:
---
{{{lessonPlan}}}
---
`,
});

const teacherFeedbackFlow = ai.defineFlow(
  {
    name: 'teacherFeedbackFlow',
    inputSchema: TeacherFeedbackInputSchema,
    outputSchema: TeacherFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
