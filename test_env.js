import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!encoded) {
  console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env.local');
  process.exit(1);
}

try {
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  console.log('Successfully decoded. Content:');
  console.log(decoded);
} catch (e) {
  console.error('Failed to decode Base64 string:', e);
  console.log('Encoded string was:', encoded);
}
