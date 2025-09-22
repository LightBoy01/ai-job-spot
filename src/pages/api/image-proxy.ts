
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const externalRes = await fetch(url);

    if (!externalRes.ok) {
      return res.status(externalRes.status).json({ error: 'Failed to fetch image' });
    }

    // Get content type and cache control headers from the external response
    const contentType = externalRes.headers.get('content-type');
    const cacheControl = externalRes.headers.get('cache-control');

    // Set headers for the client response
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    } else {
      // Default caching if none is provided
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400'); // 7 days
    }

    // Stream the image body to the client
    const imageBuffer = await externalRes.arrayBuffer();
    res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
