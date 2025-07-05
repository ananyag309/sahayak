import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins = [];
if (process.env.GOOGLE_API_KEY) {
    plugins.push(googleAI({apiKey: process.env.GOOGLE_API_KEY}));
}

export const ai = genkit({
  plugins: plugins,
  model: 'googleai/gemini-2.0-flash',
});
