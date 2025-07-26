'use server';
/**
 * @fileOverview An enhanced lesson planner AI agent that generates a structured weekly plan and provides improvement tips.
 *
 * - generateLessonPlan - A function that handles the lesson plan and feedback generation.
 * - LessonPlanInput - The input type for the generateLessonPlan function.
 * - LessonPlanOutput - The return type for the generateLessonPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LessonPlanInputSchema = z.object({
  subject: z.string().describe('The subject of the lesson plan.'),
  grade: z.string().describe('The grade level of the lesson plan.'),
  topics: z.string().describe('The topics to be covered in the lesson plan.'),
  language: z.enum(['en', 'hi', 'mr', 'ta', 'bn', 'te', 'kn', 'gu', 'pa', 'es', 'fr', 'de']).describe('The language for the lesson plan.'),
});
export type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>;

const ActivitySchema = z.object({
    activity: z.string().describe("A description of the classroom activity."),
    materials: z.string().describe("A list of materials needed for the activity."),
});

const DayPlanSchema = z.object({
    day: z.string().describe("The day of the week (e.g., Monday)."),
    topic: z.string().describe("The specific topic for the day."),
    activities: z.array(ActivitySchema).describe("An array of activities for the day."),
    homework: z.string().describe("The homework assignment for the day."),
});

const PlanSchema = z.object({
    subject: z.string(),
    grade: z.string(),
    topic: z.string().describe("The overarching topic for the week."),
    days: z.array(DayPlanSchema).describe("An array of daily lesson plans for a 5-day week."),
});
export type Plan = z.infer<typeof PlanSchema>;


const LessonPlanOutputSchema = z.object({
  plan: PlanSchema.describe('The structured weekly lesson plan.'),
  tips: z.array(z.string()).length(3).describe('An array of exactly 3 concise, actionable tips to improve the lesson plan.'),
});
export type LessonPlanOutput = z.infer<typeof LessonPlanOutputSchema>;


export async function generateLessonPlan(input: LessonPlanInput): Promise<LessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancedLessonPlanPrompt',
  input: {schema: LessonPlanInputSchema},
  output: {schema: LessonPlanOutputSchema},
  prompt: `You are a lesson plan generator helping a teacher in a multi-grade Indian classroom.

Generate a weekly lesson plan for:
- Subject: "{{subject}}"
- Topics: "{{topics}}"
- Grade: {{grade}}

Instructions:
First, generate the structured lesson plan. The response for the 'plan' key MUST be a JSON object with the following structure:
{
  "subject": "{{subject}}",
  "grade": "{{grade}}",
  "topic": "{{topics}}",
  "days": [
    {
      "day": "Monday",
      "topic": "Introduction to...",
      "activities": [
        {
          "activity": "Detailed activity description here.",
          "materials": "List of materials needed."
        }
      ],
      "homework": "Homework description for Monday."
    },
    {
      "day": "Tuesday",
      "topic": "...",
      "activities": [
        {
          "activity": "...",
          "materials": "..."
        }
      ],
      "homework": "..."
    },
    // continue for Wednesday, Thursday, Friday
  ]
}

The language used in all generated text (topics, activities, homework, tips) must be simple, clear, and appropriate for a {{language}}-speaking teacher in India.

Second, after creating the plan, give exactly **3 personalized suggestions** for improving it. These tips should be based on:
1. Cultural relevance for Indian students.
2. Simplicity of delivery in under-resourced schools (e.g., minimal materials).
3. Age-appropriate engagement for the specified grade.

The final output MUST be a single JSON object with two keys: "plan" and "tips".
`,
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
