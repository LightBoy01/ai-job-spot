import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SerializedJobSummary } from '@/lib/types';
import { formatDate } from '@/lib/dateUtils';
import FeaturedBadge from './FeaturedBadge'; // New import

interface JobCardProps {
  job: SerializedJobSummary;
}

/**
 * An interactive and data-rich card component that displays a job summary
 * and links to the full job details page.
 *
 * @param {object} props - The component props.
 * @param {object} props.job - The job object containing details to display.
 * @param {string} props.job.jobTitle - The title of the job.
 * @param {string} props.job.companyName - The name of the company.
 * @param {string} props.job.location - The location of the job.
 * @param {string} props.job.jobType - The type of employment (e.g., "Full-time").
 * @param {string} [props.job.salaryRange] - The optional salary range.
 * @returns {JSX.Element} The rendered JobCard component.
 */
const JobCard = React.memo(({ job }: JobCardProps) => {
  const { id, title, company, location, salaryRange, isNew, isFeatured, companyLogoUrl } = // Added isFeatured
    job;

  const getInitials = (companyName: string) => {
    return companyName
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Link
      href={`/jobs/${id}`}
      passHref
      className={`block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer relative overflow-hidden h-full flex flex-col
        ${isFeatured ? 'border-2 border-amber-500 ring-2 ring-amber-300' : 'border border-neutral-200/80 hover:border-secondary/50'}`}
    >
      {isFeatured && (
        <div className="absolute top-0 left-0 z-10 p-2">
          <FeaturedBadge />
        </div>
      )}
      {isNew && (
        <span className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
          NEW
        </span>
      )}
      {job.verificationDate && (
        <span
          className="absolute top-0 left-0 bg-brand-gold text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10"
          title={`Last verified on ${formatDate(job.verificationDate)}`}
        >
          VERIFIED
        </span>
      )}
      <div className="flex-grow flex flex-col">
        <div className="flex items-start space-x-4 mb-4">
          {/* Logo or Fallback */}
          <div className="flex-shrink-0 w-16 h-16 bg-neutral-100 rounded-md flex items-center justify-center border border-neutral-200">
            {companyLogoUrl ? (
              <Image
                src={`/api/image-proxy?url=${encodeURIComponent(companyLogoUrl)}`}
                alt={`${company} logo`}
                width={64}
                height={64}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <span className="text-2xl font-bold text-primary-dark">
                {getInitials(company)}
              </span>
            )}
          </div>
          {/* Title and Company */}
          <div className="flex-1">
            <h3 className="text-2xl font-serif font-bold text-primary-dark group-hover:text-secondary-dark transition-colors leading-tight">
              {title}
            </h3>
            <p className="mt-1 text-base text-neutral-600 flex items-center">
              {company}
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-neutral-500 hover:text-primary-dark"
                  title="View original job posting"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </p>
          </div>
        </div>

        {salaryRange ? (
          <p className="mt-2 text-lg text-accent-dark font-semibold">
            {salaryRange}
          </p>
        ) : (
          <p className="mt-2 text-base text-neutral-500 italic">
            Salary: Not Disclosed
          </p>
        )}

        <div className="flex-grow" />

        <div className="mt-4 border-t border-neutral-200 pt-4 flex flex-col space-y-3 text-sm text-neutral-600">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{location}</span>
          </div>
          {job.jobLevel && (
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v11.494m-5.747-6.99H17.747"
                />
              </svg>
              <span>{job.jobLevel}</span>
            </div>
          )}
          {job.source && (
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>Via: {job.source}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(job.tags || []).map((tag) => (
            <span
              key={tag}
              className="border border-secondary/30 bg-secondary/10 text-secondary-dark text-xs font-medium px-2.5 py-1 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard;
