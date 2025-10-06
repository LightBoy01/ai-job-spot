import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { getAiProvider } from '@/lib/ai/client';
import { z } from 'zod';

const SanityCheckRequest = z.object({
  content: z.string().min(50, { message: 'Content must be at least 50 characters long.' }),
});

const sanityCheckPrompt = (content: string) => `
  You are an expert editor and content quality analyst. Analyze the following text, which is a job description or a news briefing for an AI-focused website. Provide a concise, critical review of its quality.

  Return ONLY a single, valid JSON object with the following exact keys:
  - "qualityScore": A numerical score from 1 to 100, where 1 is unpublishable and 100 is perfect.
  - "pros": A string array of 2-3 positive aspects of the content (e.g., "Clear call to action", "Good use of specific terminology").
  - "cons": A string array of 2-3 potential issues or areas for improvement (e.g., "Vague language in responsibilities section", "Contains grammatical errors").
  - "suggestedImprovement": A single, actionable sentence suggesting the most impactful improvement a human editor could make.

  Do not be overly positive. Your goal is to provide a realistic, critical sanity check to help an editor make a quick decision. Be specific in your feedback.

  CONTENT TO ANALYZE:
  """
  ${content}
  """

  JSON OUTPUT:
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Authenticate Admin
    const { adminAuth } = await getFirebaseAdmin();
    const sessionCookie = req.cookies.__session || '';
    await adminAuth.verifySessionCookie(sessionCookie, true);

    // 2. Validate Input
    const validationResult = SanityCheckRequest.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid request body.', issues: validationResult.error.issues });
    }

    // 3. Get AI Provider and Generate Content
    const prompt = sanityCheckPrompt(validationResult.data.content);
    const aiProvider = getAiProvider();
    const aiResponseText = await aiProvider.generateContent(prompt);

    // 4. Parse and Respond
    const cleanedJsonString = aiResponseText.replace(/^\\`\\`\\`json\\n|\\`\\`\\`$/g, '').trim();
    const sanityCheckResult = JSON.parse(cleanedJsonString);

    res.status(200).json(sanityCheckResult);

  } catch (error) {
    console.error('Error in AI sanity check:', error);
    if (error instanceof Error) {
        if ('code' in error && error.code === 'auth/session-cookie-expired') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        return res.status(500).json({ message: error.message || 'An error occurred during the sanity check.' });
    }
    res.status(500).json({ message: 'An unknown error occurred during the sanity check.' });
  }
}