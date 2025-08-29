
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Check for a secret token to prevent unauthorized access
  if (req.query.secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  // 2. Get the path to revalidate from the request body
  const pathToRevalidate = req.body.path

  if (!pathToRevalidate) {
    return res.status(400).json({ message: 'Path to revalidate is required' })
  }

  try {
    // 3. Call the revalidate function
    await res.revalidate(pathToRevalidate)
    console.log(`Revalidated: ${pathToRevalidate}`);
    return res.json({ revalidated: true })
  } catch (err) {
    console.error(`Error revalidating ${pathToRevalidate}:`, err);
    // If there was an error, Next.js will continue to show the last successfully generated page
    return res.status(500).send('Error revalidating')
  }
}
