import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // This is a temporary debug endpoint. Do NOT keep this in production.
  // if (process.env.NODE_ENV === 'production') {
  //   return res.status(403).json({ message: 'Forbidden' });
  // }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const env = process.env.NODE_ENV || 'NOT_SET';
  return res.status(200).json({ nodeEnv: env });
}
