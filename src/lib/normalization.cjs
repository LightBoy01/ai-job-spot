// --- Normalization Helpers for Combined Key Matching ---
function normalizeCompanyName(name) {
    if (!name)
        return '';
    return name.toLowerCase()
        .replace(/\s*(llc|inc|ltd|corp|gmbh|s\.a\.)\s*$/g, '') // Remove common legal suffixes
        .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric characters
        .trim();
}
function normalizeJobTitle(title) {
    if (!title)
        return '';
    return title.toLowerCase()
        .replace(/\s*(senior|sr\.?)s*/g, '') // Remove seniority indicators
        .replace(/\s*(engineer|eng|developer|dev)\s*/g, (match) => {
        if (match.includes('eng'))
            return 'engineer';
        if (match.includes('dev'))
            return 'developer';
        return match;
    })
        .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric characters
        .trim();
}
function normalizeLocation(location) {
    if (!location)
        return '';
    return location.toLowerCase()
        .replace(/\s*(new york city|nyc)\s*/g, 'new york') // Standardize NYC
        .replace(/\s*(california|ca)\s*/g, 'california') // Standardize CA
        .replace(/\s*(work from home|anywhere)\s*/g, 'remote') // Standardize remote
        .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric characters
        .trim();
}

module.exports = { normalizeCompanyName, normalizeJobTitle, normalizeLocation };