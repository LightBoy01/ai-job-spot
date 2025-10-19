const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const SITE_URL = 'https://www.aijobspot.online';

async function revalidatePaths(paths: string[], isDryRun: boolean) {
  if (isDryRun) {
      console.log(`[DRY RUN] Would revalidate ${paths.length} paths.`);
      return;
  }
  const secret = process.env.REVALIDATE_SECRET_TOKEN?.trim();
  if (!secret) {
    console.warn('[REVALIDATION SKIPPED] REVALIDATE_SECRET_TOKEN not set.');
    return;
  }

  const revalidationPromises = paths.map((path) =>
    fetch(`${SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, path }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (res.ok) {
          console.log(`[REVALIDATED] ${path}: Status ${res.status}`, body);
        } else {
          console.error(`[REVALIDATION FAILED] for ${path}: Status ${res.status}`, body);
        }
      })
      .catch((err) => {
        console.error(`[REVALIDATION FAILED] for ${path}:`, err);
      })
  );

  await Promise.all(revalidationPromises);
  console.log('On-demand revalidation process complete.');
}

module.exports = { revalidatePaths };
