
'use server';

/**
 * @fileOverview A visual story generator that creates a series of scenes (image and narration) for a topic.
 *
 * - generateVisualStory - Generates a visual story.
 * - GenerateVisualStoryInput - The input type for the function.
 * - GenerateVisualStoryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for a single scene (narration and an image prompt)
const SceneSchema = z.object({
  narration: z.string().describe("The text to be read for this scene. Should be one or two simple sentences."),
  imagePrompt: z.string().describe("A simple, clear, child-friendly cartoon style prompt to generate an image for this scene. e.g., 'A happy bee flying over a field of flowers'."),
});

// Define the schema for the main story structure
const StoryPlanSchema = z.object({
  title: z.string().describe("A short, catchy title for the story."),
  scenes: z.array(SceneSchema).min(4).max(6).describe("An array of 4 to 6 scenes that tell the story."),
});

// Input schema for the main flow
const GenerateVisualStoryInputSchema = z.object({
  topic: z.string().describe('The topic or concept for which to generate a visual story.'),
});
export type GenerateVisualStoryInput = z.infer<typeof GenerateVisualStoryInputSchema>;


// Define the schema for a scene that now includes the generated image URL
const FinalSceneSchema = SceneSchema.extend({
    imageUrl: z.string().describe('The data URI of the generated image for this scene.'),
});

// Final output schema for the entire flow
const GenerateVisualStoryOutputSchema = z.object({
  title: z.string(),
  scenes: z.array(FinalSceneSchema),
});
export type GenerateVisualStoryOutput = z.infer<typeof GenerateVisualStoryOutputSchema>;


// Main exported function that the UI will call
export async function generateVisualStory(input: GenerateVisualStoryInput): Promise<GenerateVisualStoryOutput> {
  return generateVisualStoryFlow(input);
}


// Flow 1: Generate the story plan (text-only)
const storyPlannerPrompt = ai.definePrompt({
    name: 'visualStoryPlannerPrompt',
    input: { schema: GenerateVisualStoryInputSchema },
    output: { schema: StoryPlanSchema },
    prompt: `You are an expert storyteller for children. Create a short, simple, and engaging visual story to explain the given topic. The story should be broken down into 4 to 6 scenes. For each scene, provide a simple narration and a prompt to generate a child-friendly cartoon image.

    Topic: {{{topic}}}
    `,
});

// Flow 2: Generate a single image from a prompt
const generateImageFlow = ai.defineFlow(
    {
        name: 'generateVisualStoryImageFlow',
        inputSchema: z.string(),
        outputSchema: z.string(),
    },
    async (imagePrompt) => {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `A simple, clear, child-friendly cartoon icon of: ${imagePrompt}`,
            config: { responseModalities: ['TEXT', 'IMAGE'] },
        });

        if (!media?.url) {
            throw new Error('Image generation failed to return a data URL.');
        }

        return media.url;
    }
);

// Main flow that orchestrates the process
const generateVisualStoryFlow = ai.defineFlow(
  {
    name: 'generateVisualStoryFlow',
    inputSchema: GenerateVisualStoryInputSchema,
    outputSchema: GenerateVisualStoryOutputSchema,
  },
  async (input) => {
    // 1. Generate the text-based story plan
    const { output: storyPlan } = await storyPlannerPrompt(input);
    if (!storyPlan) {
        throw new Error('Failed to generate story plan.');
    }

    // 2. Generate an image for each scene in parallel
    const imagePromises = storyPlan.scenes.map(scene => generateImageFlow(scene.imagePrompt));
    const imageUrls = await Promise.all(imagePromises);

    // 3. Combine the story plan with the generated image URLs
    const finalScenes = storyPlan.scenes.map((scene, index) => ({
        ...scene,
        imageUrl: imageUrls[index],
    }));

    return {
        title: storyPlan.title,
        scenes: finalScenes,
    };
  }
);
