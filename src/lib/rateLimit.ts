import { NextApiRequest } from 'next';

interface RateLimitInfo {
  count: number;
  lastResetTime: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // Max 5 requests per minute per IP

export function rateLimit(req: NextApiRequest): boolean {
  const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;

  if (!ip) {
    // If IP cannot be determined, allow the request but log a warning
    console.warn('Could not determine IP address for rate limiting.');
    return true;
  }

  const now = Date.now();
  const client = rateLimitStore.get(ip);

  if (!client || (now - client.lastResetTime > WINDOW_MS)) {
    // First request or window reset
    rateLimitStore.set(ip, { count: 1, lastResetTime: now });
    return true;
  } else {
    // Within the window
    client.count++;
    rateLimitStore.set(ip, client);
    return client.count <= MAX_REQUESTS;
  }
}

// Optional: Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((client, ip) => {
    if (now - client.lastResetTime > WINDOW_MS * 2) { // Remove entries older than 2 windows
      rateLimitStore.delete(ip);
    }
  });
  console.log('Rate limit store cleanup complete. Current size:', rateLimitStore.size);
}, WINDOW_MS * 5); // Run cleanup every 5 minutes
