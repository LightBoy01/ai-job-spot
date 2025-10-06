import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { GoogleGenerativeAI as GoogleGenerativeAIType } from '@google/generative-ai';
import pRetry from 'p-retry';

export interface AiProvider {
  generateContent(prompt: string): Promise<string>;
}

const MODEL_NAME = 'gemini-1.5-pro-latest';

export class GeminiProvider implements AiProvider {
  private genAI: GoogleGenerativeAIType;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string): Promise<string> {
    const makeApiCall = async () => {
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NAME,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const result = await model.generateContent(prompt);
      const response = result.response;

      const text = response.text();
      if (!text) {
        // The SDK throws a specific error if blocked, but we'll keep this as a fallback.
        throw new Error('Invalid or empty AI API response structure.');
      }
      return text;
    };

    try {
      // The SDK has its own retry logic, but p-retry provides an extra layer of robustness.
      return await pRetry(makeApiCall, {
        retries: 2,
        minTimeout: 1000,
        onFailedAttempt: (context: { attemptNumber: number; retriesLeft: number; }) => {
          console.warn(`[GeminiProvider] Attempt ${context.attemptNumber} failed. There are ${context.retriesLeft} retries left.`);
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[GeminiProvider] Error calling AI API after multiple retries:", message);
      throw new Error('Failed to generate content from Gemini API.');
    }
  }
}