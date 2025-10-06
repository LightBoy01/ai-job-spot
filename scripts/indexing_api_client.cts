const { JWT } = require('google-auth-library');
const fetch = require('node-fetch');

const INDEXING_API_ENDPOINT =
  'https://indexing.googleapis.com/v3/urlNotifications:publish';

// This function is designed to be called from a server-side script
async function getAuthenticatedClient() {
  const keyFilePath = process.env.GOOGLE_INDEXING_KEY_FILE;

  if (!keyFilePath) {
    console.warn(
      '[Indexing API] GOOGLE_INDEXING_KEY_FILE environment variable not set. Skipping notification.'
    );
    return null;
  }

  const auth = new JWT({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  return auth;
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

async function notifyBatch(
  urls: string[],
  type: 'URL_UPDATED' | 'URL_DELETED'
) {
  if (urls.length === 0) {
    return;
  }

  const auth = await getAuthenticatedClient();
  if (!auth) return;

  const boundary = `----${Date.now()}----`;
  const body = urls
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
        `[Indexing API] Successfully sent batch notification for ${urls.length} URLs of type ${type}.`
      );
      // Optionally, you can process the multipart response here if needed
    } else {
      const errorContent = await response.text();
      console.error(
        `[Indexing API] Error sending batch notification. Status: ${response.status}, Response:`,
        errorContent
      );
    }
  } catch (error) {
    console.error(
      `[Indexing API] Exception while sending batch notification:`,
      error
    );
  }
}

const notifyUrlUpdate = (url: string) => notify(url, 'URL_UPDATED');
const notifyUrlDelete = (url: string) => notify(url, 'URL_DELETED');

module.exports = { notifyBatch, notifyUrlUpdate, notifyUrlDelete };