import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { Paddle } from '@paddle/paddle-node-sdk';
import DOMPurify from 'isomorphic-dompurify';

interface JobData {
  title: string;
  company: string;
  location: string;
  description: string;
  applyLink: string;
  posterEmail: string;
  salaryRange?: string;
  tags?: string[];
}

type ApiResponse = {
  message?: string;
  error?: string;
  checkoutUrl?: string;
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
    const jobData: JobData = req.body;

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
    console.error('Error in initiate-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: `Internal Server Error: ${errorMessage}` });
  }
}