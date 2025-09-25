import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// --- Rate Limiting (In-Memory) ---
// This is a simple in-memory store. For a production app at scale,
// you might want to use a more persistent store like Redis (e.g., with Upstash).
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests per window per IP

// --- Zod Validation Schema ---
const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long.')
    .max(100, 'Name must be no more than 100 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters long.')
    .max(5000, 'Message must be no more than 5000 characters.'),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- Rate Limiting Logic ---
  try {
    // Get the client's IP address. In Vercel, this is reliable.
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();

    const record = rateLimitStore.get(ip);

    if (record && now - record.timestamp < RATE_LIMIT_WINDOW_MS) {
      if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res
          .status(429)
          .json({ error: 'Too many requests. Please try again later.' });
      }
      rateLimitStore.set(ip, {
        count: record.count + 1,
        timestamp: record.timestamp,
      });
    } else {
      // Start a new record for this IP
      rateLimitStore.set(ip, { count: 1, timestamp: now });
    }

    // Clean up old entries periodically to prevent memory leaks
    if (Math.random() < 0.1) {
      // 10% chance to run cleanup
      for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.timestamp > RATE_LIMIT_WINDOW_MS) {
          rateLimitStore.delete(key);
        }
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, we can choose to proceed or block.
    // For now, we'll log it and proceed, but in a high-security scenario, we might block.
  }

  // --- Validation and Processing ---
  try {
    // 1. Validate the request body with Zod
    const { name, email, message } = contactFormSchema.parse(req.body);

    const sanitizedName = name.replace(/(\r\n|\n|\r)/gm, '');

    // 2. Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    // 3. Set up email data
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New Contact Form Submission from ${sanitizedName}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    // 4. Send the email
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      });
    }

    // Handle other errors (e.g., Nodemailer)
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
