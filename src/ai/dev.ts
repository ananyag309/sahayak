import { config } from 'dotenv';
config();

import '@/ai/flows/ai-chat-assistant.ts';
import '@/ai/flows/textbook-scanner.ts';
import '@/ai/flows/lesson-planner.ts';
import '@/ai/flows/diagram-generator.ts';
import '@/ai/flows/game-generator.ts';