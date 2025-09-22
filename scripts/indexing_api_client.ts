
import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';

const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

// This function is designed to be called from a server-side script
async function getAuthenticatedClient() {
  const keyFilePath = process.env.GOOGLE_INDEXING_KEY_FILE;

  if (!keyFilePath) {
    console.warn('[Indexing API] GOOGLE_INDEXING_KEY_FILE environment variable not set. Skipping notification.');
    return null;
  }

  const auth = new JWT({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  return auth;
}

async function notify(url: string, type: 'URL_UPDATED' | 'URL_DELETED') {
  const auth = await getAuthenticatedClient();
  if (!auth) return;

  const headers = {
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    url: url,
    type: type,
  });

  try {
    const token = await auth.getAccessToken();
    const response = await fetch(INDEXING_API_ENDPOINT, {
      method: 'POST',
      headers: {
        ...headers,
        'Authorization': `Bearer ${token.token}`,
      },
      body: body,
    });

    const content = await response.json();

    if (response.ok) {
      console.log(`[Indexing API] Successfully notified Google of ${type} for ${url}. Response:`, JSON.stringify(content, null, 2));
    } else {
      console.error(`[Indexing API] Error notifying Google for ${url}. Status: ${response.status}, Response:`, JSON.stringify(content, null, 2));
    }
  } catch (error) {
    console.error(`[Indexing API] Exception while notifying Google for ${url}:`, error);
  }
}

export const notifyUrlUpdate = (url: string) => notify(url, 'URL_UPDATED');
export const notifyUrlDelete = (url: string) => notify(url, 'URL_DELETED');
