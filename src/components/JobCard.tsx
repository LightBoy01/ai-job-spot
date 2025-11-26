import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SerializedJobSummary } from '@/lib/types';
import Icon from './Icon';
import { formatDate } from '@/lib/dateUtils';
import { getInitials } from '@/lib/stringUtils';

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
  const { id, title, company, location, salaryRange, isNew, isFeatured, companyLogoUrl } =
    job;

  return (
    <Link
      href={`/jobs/${id}`}
      passHref
      className={`block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer relative overflow-hidden h-full flex flex-col
        ${isFeatured ? 'border-2 border-amber-500 ring-2 ring-amber-300' : 'border border-neutral-200/80 hover:border-secondary/50'}`}>
      {isNew && (
        <span className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
          NEW
        </span>
      )}
      {job.verificationDate && (
        <span
          className="absolute top-0 left-0 bg-brand-gold text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10"
          title={`This job was last verified as active on ${formatDate(job.verificationDate)}.`}
        >
          VERIFIED
        </span>
      )}
      <div className="flex-grow flex flex-col">
        {/* Card Header */}
        <div className="flex items-start space-x-4 mb-4">
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
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-serif font-bold text-primary-dark group-hover:text-secondary-dark transition-colors leading-tight break-words line-clamp-2">
              {title}
            </h3>
            <p className="mt-1 text-base text-neutral-600 flex items-center break-words">
              {company}
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-neutral-500 hover:text-primary-dark"
                  title="View original job posting"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="external-link" className="h-4 w-4" />
                </a>
              )}
            </p>
          </div>
        </div>

        {/* Salary Info */}
        <div className="my-2">
          {salaryRange ? (
            <p className="text-lg text-accent-dark font-semibold">
              {salaryRange}
            </p>
          ) : (
            <p className="text-base text-neutral-500 italic">
              Salary: Not Disclosed
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap gap-2">
            {(job.tags || []).slice(0, 4).map((tag) => (
              <Link
                href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                key={tag}
                onClick={(e) => e.stopPropagation()}
                className="border border-secondary/30 bg-secondary/10 text-secondary-dark text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-secondary-dark hover:text-white transition-colors duration-200"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 border-t border-neutral-200 pt-4 flex flex-col space-y-3 text-sm text-neutral-700">
        <div className="flex items-center">
          <Icon
            name="location"
            className="h-5 w-5 mr-2.5 text-neutral-500 flex-shrink-0"
          />
          <span className="truncate" title={location}>{location}</span>
        </div>
        {job.jobLevel && (
          <div className="flex items-center">
            <Icon
              name="level"
              className="h-5 w-5 mr-2.5 text-neutral-500 flex-shrink-0"
            />
            <span>{job.jobLevel}</span>
          </div>
        )}
        {job.source && (
          <div className="flex items-center">
            <Icon
              name="source"
              className="h-5 w-5 mr-2.5 text-neutral-500 flex-shrink-0"
            />
            <span className="truncate">Via: {job.source}</span>
          </div>
        )}
      </div>
    </Link>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard;
