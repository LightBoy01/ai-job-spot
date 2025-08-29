import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { Paddle } from '@paddle/paddle-node-sdk';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  applyLink: z.string().url('A valid application link URL is required'),
  posterEmail: z.string().email('A valid poster email is required'),
  salaryRange: z.string().optional(),
  tags: z.array(z.string()).optional(),
});



type ApiResponse = {
  message?: string;
  error?: string;
  checkoutUrl?: string;
  details?: z.ZodIssue[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const paddleApiKey = process.env.PADDLE_API_KEY;
  const priceId = process.env.PADDLE_PRICE_ID;

  if (!paddleApiKey || !priceId) {
    console.error('Paddle API key or Price ID is not configured in environment variables.');
    return res.status(500).json({ error: 'Payment system is not configured. Please contact support.' });
  }

  try {
    const jobData = jobSchema.parse(req.body);

    // Sanitize the HTML content of the description
    const sanitizedDescription = DOMPurify.sanitize(jobData.description);

    const pendingDocRef = await adminDb.collection('pending_payments').add({
      ...jobData,
      description: sanitizedDescription, // Use the sanitized description
      status: 'pending',
      createdAt: new Date(),
    });

    const paddle = new Paddle(paddleApiKey);

    const checkout = await paddle.transactions.create({
      items: [{ priceId: priceId, quantity: 1 }],
      customData: {
        firestoreDocId: pendingDocRef.id,
      },
    });

    if (!checkout.checkout?.url) {
        throw new Error('Failed to create Paddle checkout URL.');
    }

    res.status(200).json({ checkoutUrl: checkout.checkout.url });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error in initiate-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: `Internal Server Error: ${errorMessage}` });
  }
}