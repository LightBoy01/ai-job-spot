import { JobSchema, Job } from '../schemas.js';

/**
 * Fetches jobs from the hiring.cafe internal API.
 * @returns A promise that resolves to the list of job results.
 */
export async function fetchHiringCafeJobs() {
  const apiUrl = 'https://hiring.cafe/api/search-jobs';
  const payload = {
    size: 50, // Fetch a decent number of recent jobs
    page: 0,
    searchState: {
      searchQuery: 'ai OR llm OR "machine learning" OR "data scientist"', // Broad query for AI roles
      sortBy: 'date',
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.results?.length || 0} jobs from hiring.cafe`);

    const validatedItems = (data.results || []).map((item: unknown) => {
        const result = JobSchema.safeParse(item);
        if (!result.success) {
            console.warn(`  > Invalid job item found in hiring.cafe:`, result.error.flatten());
            return null;
        }
        return result.data;
    }).filter((item: Job | null): item is Job => item !== null);

    return validatedItems;

  } catch (error) {
    console.error('Failed to fetch jobs from hiring.cafe:', error);
    throw error;
  }
}
