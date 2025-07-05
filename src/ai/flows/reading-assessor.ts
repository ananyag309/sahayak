'use server';
/**
 * @fileOverview An AI-powered reading assessment tool.
 *
 * - assessReading - A function that handles the reading assessment process.
 * - AssessReadingInput - The input type for the assessReading function.
 * - AssessReadingOutput - The return type for the assessReading function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessReadingInputSchema = z.object({
    passage: z.string().describe('The original text passage that the student was asked to read.'),
    audioDataUri: z.string().describe("The student's audio recording as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    passageWordCount: z.number().describe('The total number of words in the passage.'),
    durationSeconds: z.number().describe('The duration of the audio recording in seconds.'),
});
export type AssessReadingInput = z.infer<typeof AssessReadingInputSchema>;

const AssessReadingOutputSchema = z.object({
    wordsPerMinute: z.number().describe('Calculated words per minute (WPM).'),
    accuracy: z.number().describe('A percentage score (0-100) of reading accuracy.'),
    mispronouncedWords: z.array(z.object({
        word: z.string().describe('The word that was mispronounced.'),
        pronunciation: z.string().describe('How the student pronounced it.'),
    })).describe('A list of words that were likely mispronounced or skipped.'),
    feedback: z.string().describe('Constructive, encouraging feedback for the student.'),
});
export type AssessReadingOutput = z.infer<typeof AssessReadingOutputSchema>;


export async function assessReading(input: AssessReadingInput): Promise<AssessReadingOutput> {
    return assessReadingFlow(input);
}

const prompt = ai.definePrompt({
    name: 'assessReadingPrompt',
    input: {schema: z.object({passage: z.string(), audioDataUri: z.string()})},
    output: {schema: AssessReadingOutputSchema.omit({ wordsPerMinute: true })},
    prompt: `You are an expert reading coach. Your task is to analyze a student's reading of a passage and provide a detailed assessment.

You will be given the original text and an audio file of the student reading it.

1.  Compare the student's spoken words in the audio to the original text.
2.  Identify any words that were mispronounced, skipped, or substituted. List them in the 'mispronouncedWords' array. For each, provide the original word and what you think the student said.
3.  Based on the number of errors and the total number of words, calculate an accuracy score from 0 to 100.
4.  Provide encouraging and constructive feedback for the student, highlighting what they did well and suggesting areas for improvement.

DO NOT invent information. Base your analysis solely on the provided text and audio.

Original Passage:
"{{{passage}}}"

Student's Audio:
{{media url=audioDataUri}}
`,
});

const assessReadingFlow = ai.defineFlow({
    name: 'assessReadingFlow',
    inputSchema: AssessReadingInputSchema,
    outputSchema: AssessReadingOutputSchema,
}, async (input) => {
    // Calculate WPM, ensuring we don't divide by zero
    const wpm = (input.durationSeconds > 0) ? Math.round((input.passageWordCount / input.durationSeconds) * 60) : 0;

    const {output} = await prompt({
        passage: input.passage,
        audioDataUri: input.audioDataUri,
    });

    if (!output) {
      throw new Error("The AI failed to produce an assessment.");
    }

    return {
        ...output,
        wordsPerMinute: wpm,
    };
});
