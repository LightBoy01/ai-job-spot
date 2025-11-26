import { gotScraping } from 'got-scraping';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const AI_API_KEY = process.env.AI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AI_API_KEY}`;

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export async function callGeminiApi(prompt: string): Promise<string | null> {
    if (!AI_API_KEY) {
        console.warn("AI_API_KEY environment variable not set. Skipping AI enrichment.");
        return null;
    }

    try {
        const response = await gotScraping.post({
            url: GEMINI_API_URL,
            json: {
                contents: [{ parts: [{ text: prompt }] }],
            },
            responseType: 'json'
        });

        const responseBody = response.body as GeminiResponse;
        const aiResponseText = responseBody?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponseText) {
            console.error("Error: AI response was malformed or empty.", response.body);
            return null;
        }

        return aiResponseText;

    } catch (error: unknown) {
        let message: string;
        if (error instanceof Error) {
            // The type of error is now narrowed to Error.
            // However, 'response' is not a standard property, so we check for it.
            if ('response' in error && (error as { response?: { body: unknown } }).response) {
                const body = (error as { response: { body: unknown } }).response.body;
                message = typeof body === 'string' ? body : JSON.stringify(body);
            } else {
                message = error.message;
            }
        } else {
            message = String(error);
        }
        console.error("Error calling AI API:", message);
        return null;
    }
}
