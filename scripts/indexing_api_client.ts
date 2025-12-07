import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';


const INDEXING_API_ENDPOINT =
  'https://indexing.googleapis.com/v3/urlNotifications:publish';

// This function is designed to be called from a server-side script
async function getAuthenticatedClient() {
  try {
    const keyFilePath = process.env.GOOGLE_INDEXING_KEY_FILE;

    if (!keyFilePath) {
      console.error('[Indexing API] GOOGLE_INDEXING_KEY_FILE environment variable is not set. Indexing API will not function.');
      return null;
    }

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

const INDEXING_API_BATCH_ENDPOINT = 'https://indexing.googleapis.com/batch';

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
        Authorization: `Bearer ${token.token}`,
      },
      body: body,
    });

    const content = await response.json();

    if (response.ok) {
      console.log(
        `[Indexing API] Successfully notified Google of ${type} for ${url}.`
      );
    } else {
      console.error(
        `[Indexing API] Error notifying Google for ${url}. Status: ${
          response.status
        }, Response:`,
        JSON.stringify(content, null, 2)
      );
    }
  } catch (error) {
    console.error(
      `[Indexing API] Exception while notifying Google for ${url}:`,
      error
    );
  }
}

export async function notifyBatch(
  urls: string[],
  type: 'URL_UPDATED' | 'URL_DELETED'
) {
  if (urls.length === 0) {
    return;
  }

  const auth = await getAuthenticatedClient();
  if (!auth) return;

  // Google Indexing API batch limit is 100 items per request
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const chunk = urls.slice(i, i + BATCH_SIZE);
    const boundary = `----${Date.now()}----`;
    
    const body = chunk
      .map(url => {
        const content = JSON.stringify({ url, type });
        return `--${boundary}
Content-Type: application/http
Content-Transfer-Encoding: binary
Content-ID: <${url}>

POST /v3/urlNotifications:publish
Content-Type: application/json

${content}`;
      })
      .join('\n') + `\n--${boundary}--`;

    try {
      console.log(`[Indexing API] Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(urls.length / BATCH_SIZE)} (${chunk.length} items)...`);
      const token = await auth.getAccessToken();
      const response = await fetch(INDEXING_API_BATCH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/mixed; boundary=${boundary}`,
          Authorization: `Bearer ${token.token}`,
        },
        body: body,
      });

      if (response.ok) {
        console.log(
          `[Indexing API] Batch ${Math.floor(i / BATCH_SIZE) + 1} successful.`
        );
      } else {
        const errorContent = await response.text();
        console.error(
          `[Indexing API] Error sending batch ${Math.floor(i / BATCH_SIZE) + 1}. Status: ${response.status}, Response:`,
          errorContent
        );
      }
    } catch (error) {
      console.error(
        `[Indexing API] Exception while sending batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error
      );
    }
  }
}

export const notifyUrlUpdate = (url: string) => notify(url, 'URL_UPDATED');
export const notifyUrlDelete = (url: string) => notify(url, 'URL_DELETED');

