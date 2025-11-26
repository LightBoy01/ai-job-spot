import { GeminiProvider } from './providers/gemini.js';
import type { AiProvider } from './providers/gemini.js';

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

let defaultProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (defaultProvider) {
    return defaultProvider;
  }

  const geminiApiKey = process.env.AI_API_KEY;

  if (!geminiApiKey) { // Check for missing key first
    throw new Error('[AIClient] No AI provider could be initialized. Please check your environment variables (e.g., AI_API_KEY).');
  }

  console.log('[AIClient] Initializing default provider: Gemini');
  defaultProvider = new GeminiProvider(geminiApiKey);
  return defaultProvider as AiProvider;
}
