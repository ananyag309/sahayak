
'use server';

/**
 * @fileOverview A video generator flow using Google's Veo model.
 *
 * - generateVideo - Generates a video from a text prompt.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MediaPart } from 'genkit';
import { Readable } from 'stream';

const GenerateVideoInputSchema = z.object({
  topic: z.string().describe('The topic or concept for which to generate a video.'),
  durationSeconds: z.number().min(3).max(8).default(5).describe('The desired duration of the video in seconds.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

// Helper function to download the video from the GCS URL and convert it to a data URI
async function videoToDataUri(videoPart: MediaPart): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    
    if (!videoPart?.media?.url) {
        throw new Error('No video URL found in the media part.');
    }
    
    // The URL returned by Veo needs the API key to be accessed.
    const videoUrl = `${videoPart.media.url}&key=${process.env.GOOGLE_API_KEY}`;
    
    const response = await fetch(videoUrl);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBuffer = await response.buffer();
    const base64Video = videoBuffer.toString('base64');
    const contentType = videoPart.media.contentType || 'video/mp4';

    return `data:${contentType};base64,${base64Video}`;
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: `Generate a high-quality, educational, and visually engaging video that explains the concept of: "${input.topic}". The video should be suitable for students.`,
      config: {
        durationSeconds: input.durationSeconds,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation for video generation.');
    }

    // Poll for the result. This can take a while (up to a minute or more).
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video in the operation result.');
    }
    
    const videoDataUri = await videoToDataUri(video);

    return { videoDataUri };
  }
);
