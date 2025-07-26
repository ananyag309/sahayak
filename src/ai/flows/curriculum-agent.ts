'use server';
/**
 * @fileOverview A Curriculum Alignment Agent that uses a tool to check topics against educational standards.
 *
 * - runCurriculumAgent - A function that handles the agent's analysis process.
 * - CurriculumAgentInput - The input type for the agent.
 * - CurriculumAgentOutput - The return type from the agent.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a "tool" that the agent can use to get information.
// This tool simulates fetching curriculum standards for a given grade.
const getCurriculumStandards = ai.defineTool(
  {
    name: 'getCurriculumStandards',
    description: 'Returns the official curriculum standards for a given grade level. This should be called before providing any analysis or feedback.',
    inputSchema: z.object({
      grade: z.number().describe('The grade level to fetch standards for.'),
    }),
    outputSchema: z.object({
        standards: z.array(z.string()).describe("A list of key learning standards for the specified grade.")
    }),
  },
  async (input) => {
    console.log(`[Tool Used] Fetching standards for grade: ${input.grade}`);
    // In a real app, this would query a database or an external API.
    // For this example, we'll return hardcoded standards.
    if (input.grade >= 1 && input.grade <= 3) {
      return { standards: ["Basic number recognition (1-100)", "Simple addition and subtraction", "Identifying basic shapes", "Reading and writing simple CVC words."] };
    } else if (input.grade >= 4 && input.grade <= 6) {
      return { standards: ["Multiplication and division", "Understanding fractions", "The water cycle", "Structure of a plant", "Introduction to Indian history."] };
    } else {
       return { standards: ["Advanced topics not covered in this example. Please specify a grade between 1 and 6."] };
    }
  }
);


// Define the schemas for the main agent flow
export const CurriculumAgentInputSchema = z.object({
  topic: z.string().describe('The lesson topic to be analyzed.'),
  grade: z.number().describe('The grade level for the lesson.'),
});
export type CurriculumAgentInput = z.infer<typeof CurriculumAgentInputSchema>;

export const CurriculumAgentOutputSchema = z.object({
  alignmentAnalysis: z.string().describe("A detailed analysis of how the topic aligns with the curriculum standards."),
  suggestedActivities: z.array(z.string()).describe("A list of suggested activities that support the curriculum standards for this topic."),
  gapsIdentified: z.string().describe("Any identified gaps between the topic and the curriculum, with suggestions for how to bridge them."),
});
export type CurriculumAgentOutput = z.infer<typeof CurriculumAgentOutputSchema>;

// Define the main prompt for the agent, making it aware of the tool
const agentPrompt = ai.definePrompt({
  name: 'curriculumAgentPrompt',
  tools: [getCurriculumStandards], // Make the tool available to the LLM
  input: {schema: CurriculumAgentInputSchema},
  output: {schema: CurriculumAgentOutputSchema},
  prompt: `You are an expert curriculum alignment agent. Your task is to analyze a given lesson topic and determine how well it aligns with the official educational standards for that grade.

  1.  First, you MUST use the 'getCurriculumStandards' tool to fetch the relevant standards for the provided grade.
  2.  Once you have the standards, compare the user's topic against them.
  3.  Provide a detailed analysis in the 'alignmentAnalysis' field.
  4.  Suggest creative and relevant classroom activities in the 'suggestedActivities' field.
  5.  Identify any gaps and suggest how to cover them in the 'gapsIdentified' field.

  Topic: {{{topic}}}
  Grade: {{{grade}}}
  `,
});


const curriculumAgentFlow = ai.defineFlow(
    {
        name: 'curriculumAgentFlow',
        inputSchema: CurriculumAgentInputSchema,
        outputSchema: CurriculumAgentOutputSchema,
    },
    async (input) => {
        const {output} = await agentPrompt(input);
        if (!output) {
            throw new Error("The agent failed to produce a response.");
        }
        return output;
    }
);

// Define the main flow for the agent
export async function runCurriculumAgent(input: CurriculumAgentInput): Promise<CurriculumAgentOutput> {
    return curriculumAgentFlow(input);
}
