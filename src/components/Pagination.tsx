import React from 'react';

interface PaginationProps {
  currentPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isLoading,
}) => {
  return (
    <div className="flex items-center justify-center space-x-8 mt-12 mb-8 font-serif">
      <button
        onClick={onPrevious}
        disabled={!hasPrevious || isLoading}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
          ${
            !hasPrevious || isLoading
              ? 'border-neutral-400 text-neutral-400 cursor-not-allowed'
              : 'border-secondary text-primary-dark hover:bg-secondary hover:text-white hover:border-secondary shadow-sm hover:shadow-md'
          }
        `}
        aria-label="Previous Page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-primary-dark tracking-widest">
          PAGE
        </span>
        <span className="text-3xl font-serif text-secondary-dark font-medium leading-none mt-1">
          {currentPage}
        </span>
      </div>

      <button
        onClick={onNext}
        disabled={!hasNext || isLoading}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
          ${
            !hasNext || isLoading
              ? 'border-neutral-400 text-neutral-400 cursor-not-allowed'
              : 'border-secondary text-primary-dark hover:bg-secondary hover:text-white hover:border-secondary shadow-sm hover:shadow-md'
          }
        `}
        aria-label="Next Page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
