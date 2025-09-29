import { NextApiRequest, NextApiResponse } from 'next';
import { lookup } from 'dns/promises';
import ipaddr from 'ipaddr.js';

// Define a whitelist of allowed domains for the image proxy.
const ALLOWED_DOMAINS = [
  'localhost',
  'aijobspot.online',
  'www.aijobspot.online',
  'lh3.googleusercontent.com',
  // Add other trusted image hosting domains here as needed
];

// List of IP ranges that are considered private or special-purpose.
// An attacker could use DNS rebinding to trick the server into requesting these.
const FORBIDDEN_IP_RANGES = [
    'private', 
    'uniqueLocal', 
    'loopback', 
    'linkLocal', 
    'reserved', 
    'carrierGradeNat'
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // 1. Primary Check: Hostname must be in the explicit allowlist.
  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    console.warn(`[Image-Proxy] Blocked: Domain not in allowlist: ${parsedUrl.hostname}`);
    return res.status(403).json({ error: 'Forbidden: Image source not allowed' });
  }

  try {
    // 2. Secondary Check (Anti-SSRF/DNS Rebinding): Resolve the hostname to an IP address.
    const { address: resolvedIp } = await lookup(parsedUrl.hostname);
    const ip = ipaddr.parse(resolvedIp);

    // 3. Verify the resolved IP is not in a private or reserved range.
    if (FORBIDDEN_IP_RANGES.includes(ip.range())) {
        console.warn(`[Image-Proxy] Blocked: Resolved to a forbidden IP range (${ip.range()}): ${resolvedIp}`);
        return res.status(403).json({ error: 'Forbidden: Host resolves to a non-public IP address.' });
    }

    console.log(`[Image-Proxy] Allowed: Fetching ${url} from resolved public IP ${resolvedIp}`);
    const externalRes = await fetch(url, {
        headers: {
            'Host': parsedUrl.hostname // Explicitly set Host header
        }
    });

    if (!externalRes.ok) {
      return res
        .status(externalRes.status)
        .json({ error: 'Failed to fetch image' });
    }

    const contentType = externalRes.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
        return res.status(400).json({ error: 'Forbidden: URL did not return an image.' });
    }

    const cacheControl = externalRes.headers.get('cache-control');
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Cache-Control',
      cacheControl || 'public, max-age=604800, stale-while-revalidate=86400' // 7 days
    );

    const imageBuffer = await externalRes.arrayBuffer();
    res.send(Buffer.from(imageBuffer));

  } catch (e: any) {
    console.error('[Image-Proxy] Unhandled Error:', e);
    if (e.code === 'ENOTFOUND') {
        return res.status(404).json({ error: 'Host not found.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}