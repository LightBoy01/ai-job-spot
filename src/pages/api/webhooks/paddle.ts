import type { NextApiRequest, NextApiResponse } from 'next';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import { adminDb } from '@/lib/firebaseAdmin';
import { buffer } from 'micro';

interface CustomData {
  firestoreDocId: string;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const paddleApiKey = process.env.PADDLE_API_KEY;
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!paddleApiKey || !webhookSecret) {
    console.error('Paddle API key or Webhook Secret is not configured.');
    return res.status(500).json({ error: 'Webhook system is not configured.' });
  }

  try {
    const paddle = new Paddle(paddleApiKey);
    const signature = req.headers['paddle-signature'] as string;
    const rawBody = await buffer(req);

    const event = await paddle.webhooks.unmarshal(rawBody.toString(), webhookSecret, signature);

    if (!event) {
      throw new Error('Webhook signature verification failed.');
    }

    switch (event.eventType) {
      case EventName.TransactionCompleted:
        console.log(`Transaction ${event.data.id} completed.`);

        const customData = event.data.customData as CustomData;
        const firestoreDocId = customData?.firestoreDocId;

        if (!firestoreDocId) {
          throw new Error(`Missing firestoreDocId in customData for transaction ${event.data.id}`);
        }

        const jobsRef = adminDb.collection('jobs');
        const existingJobQuery = await jobsRef.where('paddleTransactionId', '==', event.data.id).limit(1).get();
        if (!existingJobQuery.empty) {
          console.log(`Transaction ${event.data.id} has already been processed. Skipping.`);
          return res.status(200).json({ message: 'Already processed.' });
        }

        const pendingDocRef = adminDb.collection('pending_payments').doc(firestoreDocId);
        const pendingDoc = await pendingDocRef.get();

        if (!pendingDoc.exists) {
          throw new Error(`Pending document with ID ${firestoreDocId} not found.`);
        }
        const jobData = pendingDoc.data();

        await jobsRef.add({
          ...jobData,
          status: 'pending_review',
          paddleTransactionId: event.data.id,
          createdAt: new Date(),
        });

        await pendingDocRef.delete();

        console.log(`Successfully processed transaction ${event.data.id} and created job post.`);
        break;

      default:
        console.log(`Received unhandled event: ${event.eventType}`);
    }

    res.status(200).json({ message: 'Webhook handled successfully.' });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Error in webhook handler:', errorMessage);
    res.status(400).json({ error: `Webhook Error: ${errorMessage}` });
  }
};

export default handler;
