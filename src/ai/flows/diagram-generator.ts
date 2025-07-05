'use server';

/**
 * @fileOverview Diagram generator flow.
 *
 * - generateDiagram - A function that handles the diagram generation process.
 * - GenerateDiagramInput - The input type for the generateDiagram function.
 * - GenerateDiagramOutput - The return type for the generateDiagram function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDiagramInputSchema = z.object({
  topic: z.string().describe('The topic or concept for which to generate a diagram.'),
});
export type GenerateDiagramInput = z.infer<typeof GenerateDiagramInputSchema>;

const GenerateDiagramOutputSchema = z.object({
  diagramUrl: z.string().describe('URL of the generated diagram.'),
});
export type GenerateDiagramOutput = z.infer<typeof GenerateDiagramOutputSchema>;

export async function generateDiagram(input: GenerateDiagramInput): Promise<GenerateDiagramOutput> {
  return generateDiagramFlow(input);
}

const diagramGeneratorPrompt = ai.definePrompt({
  name: 'diagramGeneratorPrompt',
  input: {schema: GenerateDiagramInputSchema},
  output: {schema: GenerateDiagramOutputSchema},
  prompt: `You are an expert in creating educational diagrams. Based on the topic provided, generate a URL for a chalkboard-style diagram that visually explains the concept.

Topic: {{{topic}}}

Ensure the diagram is clear, concise, and suitable for students.

Please only return the URL of the image. Do not include any other text.`, 
});

const generateDiagramFlow = ai.defineFlow(
  {
    name: 'generateDiagramFlow',
    inputSchema: GenerateDiagramInputSchema,
    outputSchema: GenerateDiagramOutputSchema,
  },
  async input => {
    const {output} = await diagramGeneratorPrompt(input);
    return output!;
  }
);
