// --- Normalization Helpers for Combined Key Matching ---
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s*(llc|inc|ltd|corp|gmbh|s\.a\.)\s*$/g, '') // Remove common legal suffixes
    .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric characters
    .trim();
}

export function normalizeJobTitle(title: string): string {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/\s*(senior|sr\.?)s*/g, '') // Remove seniority indicators
    .replace(/\s*(engineer|eng|developer|dev)\s*/g, (match) => { // Standardize common role variations
      if (match.includes('eng')) return 'engineer';
      if (match.includes('dev')) return 'developer';
      return match;
    })
    .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric characters
    .trim();
}

export function normalizeLocation(location: string): string {
  if (!location) return '';
  return location.toLowerCase()
    .replace(/\s*(new york city|nyc)\s*/g, 'new york') // Standardize NYC
    .replace(/\s*(california|ca)\s*/g, 'california') // Standardize CA
    .replace(/\s*(work from home|anywhere)\s*/g, 'remote') // Standardize remote
    .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric characters
    .trim();
}
