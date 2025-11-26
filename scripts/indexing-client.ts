import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import * as GoogleAuth from 'google-auth-library';
import fs from 'fs/promises'; // Import fs.promises for async file operations

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const METADATA_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications/metadata';
const PUBLISH_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

/**
 * Creates an authenticated JWT client from the service account credentials.
 */
async function getAuthenticatedClient(): Promise<JWT | null> {
  try {
    const keyFilePath = '/data/data/com.termux/files/home/ai-job-spot/ai-jobs-spot-bc835af65f64.json';

    const auth = new JWT({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    return auth;
  } catch (error) {
    console.error('[Indexing API] Failed to create JWT client from key file.', error);
    return null;
  }
}

/**
 * Fetches the metadata for a given URL from the Indexing API.
 * @param url The full URL to check.
 */
async function getNotificationStatus(url: string) {
  console.log(`Fetching notification status for: ${url}`);
  const auth = await getAuthenticatedClient();
  if (!auth) return;

  const endpoint = `${METADATA_ENDPOINT}?url=${encodeURIComponent(url)}`;

  try {
    const token = await auth.getAccessToken();
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n--- Notification Status Report ---');
      console.log(`URL: ${data.url}`);
      console.log(`Last Update Type: ${data.latestUpdate.type}`);
      console.log(`Notification Time: ${new Date(data.latestUpdate.notifyTime).toUTCString()}`);
      console.log('------------------------------------\n');
    } else {
      console.error(`\n[ERROR] Failed to get status. API responded with ${response.status}:`);
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n[ERROR] An exception occurred while fetching status:', error);
  }
}

/**
 * Submits a URL to the Indexing API for an update.
 * @param url The full URL to submit.
 */
async function submitUrl(url: string) {
  console.log(`Submitting URL for indexing: ${url}`);
  const auth = await getAuthenticatedClient();
  if (!auth) return;

  const body = JSON.stringify({
    url: url,
    type: 'URL_UPDATED',
  });

  try {
    const token = await auth.getAccessToken();
    const response = await fetch(PUBLISH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.token}`,
      },
      body: body,
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`\n--- Submission Successful ---`);
      console.log(`URL '${url}' was successfully submitted for indexing.`);
      console.log('It may take some time for Google to process the request.');
      console.log('---------------------------\n');
    } else {
      console.error(`\n[ERROR] Failed to submit URL. API responded with ${response.status}:`);
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n[ERROR] An exception occurred during submission:', error);
  }
}

/**
 * Main function to parse arguments and dispatch commands.
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const urlArg = args.find(arg => arg.startsWith('--url='));

  if (!command || !['status', 'submit'].includes(command)) {
    console.error('Invalid command. Please use \'status\' or \'submit\'.');
    console.error('Usage: ts-node scripts/indexing-client.ts <status|submit> --url=<your_url>');
    return;
  }

  if (!urlArg) {
    console.error('Missing --url argument.');
    console.error('Usage: ts-node scripts/indexing-client.ts <status|submit> --url=<your_url>');
    return;
  }

  const url = urlArg.split('=')[1];
  if (!url) {
    console.error('URL cannot be empty.');
    return;
  }

  switch (command) {
    case 'status':
      await getNotificationStatus(url);
      break;
    case 'submit':
      await submitUrl(url);
      break;
  }
}

main().catch(console.error);
