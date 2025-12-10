import React, { useState, useEffect } from 'react';

interface FilterPillProps {
  label: string;
  onRemove: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, onRemove }) => (
  <div className="flex items-center bg-secondary/20 text-secondary-dark rounded-full px-3 py-1 text-sm font-medium font-sans">
    <span>{label}</span>
    <button onClick={onRemove} className="ml-2 font-bold text-lg text-secondary-dark/70 hover:text-red-600 transition-colors duration-150">
      &times;
    </button>
  </div>
);

interface JobSearchBarProps {
  initialFilters?: { query: string; location: string; jobLevel: string; tags: string; sortOrder: string } | null;
  onFilterChange: (filters: { query: string; location: string; jobLevel: string; tags: string; sortOrder: string }) => void;
}

const JobSearchBar: React.FC<JobSearchBarProps> = ({ initialFilters, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters?.query || '');
  const [locationFilter, setLocationFilter] = useState(initialFilters?.location || '');
  const [jobLevelFilter, setJobLevelFilter] = useState(initialFilters?.jobLevel || '');
  const [tagsFilter, setTagsFilter] = useState(initialFilters?.tags || '');
  const [sortOrder, setSortOrder] = useState(initialFilters?.sortOrder || 'desc');
  const [showFilters, setShowFilters] = useState(!!(initialFilters?.location || initialFilters?.jobLevel || initialFilters?.tags));

  useEffect(() => {
    // Only trigger if the filters have actually changed from the initial values
    // OR if we are just interacting. 
    // We don't want to fire immediately on mount if the parent passed them in, 
    // unless we want to confirm the search.
    // Actually, simple debounce is fine as long as we don't cause a loop.
    const delayDebounceFn = setTimeout(() => {
      onFilterChange({ query: searchQuery, location: locationFilter, jobLevel: jobLevelFilter, tags: tagsFilter, sortOrder });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, locationFilter, jobLevelFilter, tagsFilter, sortOrder, onFilterChange]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setJobLevelFilter('');
    setTagsFilter('');
    setSortOrder('desc');
  };

  return (
    <div className="mb-12 flex flex-col items-center">
      <div className="relative w-full max-w-lg">
        <input
          type="text"
          placeholder="Search by title, company, location, or tags..."
          className="w-full p-4 pl-12 font-sans border-2 border-primary-dark/20 bg-neutral-cream/30 rounded-lg shadow-inner focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg
            className="h-5 w-5 text-primary-dark/50"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <div className="w-full max-w-lg flex items-center justify-center space-x-4 mt-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-primary-dark hover:text-secondary-dark font-semibold transition-colors font-sans"
        >
          {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
        </button>
        {(searchQuery || locationFilter || jobLevelFilter || tagsFilter) && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-red-600 hover:text-red-800 font-semibold transition-colors font-sans"
          >
            Clear Filters
          </button>
        )}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="text-sm text-primary-dark bg-neutral-cream/70 border-2 border-primary-dark/20 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
        >
          <option value="desc">Newest</option>
          <option value="asc">Oldest</option>
        </select>
      </div>

      <div className="w-full max-w-lg mt-4 flex flex-wrap items-center justify-center gap-2">
        {searchQuery && (
          <FilterPill
            label={`Query: "${searchQuery}"`}
            onRemove={() => setSearchQuery('')}
          />
        )}
        {locationFilter && (
          <FilterPill
            label={`Location: ${locationFilter}`}
            onRemove={() => setLocationFilter('')}
          />
        )}
        {jobLevelFilter && (
          <FilterPill
            label={`Level: ${jobLevelFilter}`}
            onRemove={() => setJobLevelFilter('')}
          />
        )}
        {tagsFilter && (
          <FilterPill
            label={`Tags: ${tagsFilter}`}
            onRemove={() => setTagsFilter('')}
          />
        )}
      </div>

      {showFilters && (
        <div className="w-full max-w-lg mt-6 p-6 bg-primary-dark/5 rounded-lg shadow-inner border border-primary-dark/10 space-y-4 font-sans">
          <div>
            <label htmlFor="locationFilter" className="block text-sm font-medium text-primary-dark/80 mb-1">Location</label>
            <input
              type="text"
              id="locationFilter"
              placeholder="e.g., Remote, New York"
              className="w-full p-3 bg-neutral-cream/70 border-2 border-primary-dark/20 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="jobLevelFilter" className="block text-sm font-medium text-primary-dark/80 mb-1">Job Level</label>
            <select
              id="jobLevelFilter"
              className="w-full p-3 bg-neutral-cream/70 border-2 border-primary-dark/20 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
              value={jobLevelFilter}
              onChange={(e) => setJobLevelFilter(e.target.value)}
            >
              <option value="">Any</option>
              <option value="Entry-Level">Entry-Level</option>
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Principal">Principal</option>
              <option value="Director">Director</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
          <div>
            <label htmlFor="tagsFilter" className="block text-sm font-medium text-primary-dark/80 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              id="tagsFilter"
              placeholder="e.g., ML, GenAI, Remote"
              className="w-full p-3 bg-neutral-cream/70 border-2 border-primary-dark/20 rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
              value={tagsFilter}
              onChange={(e) => setTagsFilter(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSearchBar;
