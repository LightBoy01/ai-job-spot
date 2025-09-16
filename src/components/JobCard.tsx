import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SerializedJobPosting } from '@/lib/types';
import { EXPIRES_SOON_THRESHOLD_DAYS } from '@/lib/constants';
import { formatDate } from '@/lib/dateUtils';

interface JobCardProps {
  job: SerializedJobPosting;
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
  const { id, title, company, location, salaryRange, isNew } = job;

  return (
    <Link href={`/jobs/${id}`} passHref className="block bg-neutral-50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer border border-neutral-200 hover:border-primary-dark relative overflow-hidden">
      {isNew && (
        <span className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">NEW</span>
      )}
      <div className="flex flex-col">
        <h3 className="text-2xl font-serif font-semibold text-neutral-800 group-hover:text-primary-dark transition-colors leading-tight mb-2">
          {title}
        </h3>

        <p className="mt-2 text-lg text-neutral-700">
          {company}
        </p>

        {salaryRange ? (
          <p className="mt-3 text-lg text-emerald-700 font-semibold">
            {salaryRange}
          </p>
        ) : (
          <p className="mt-3 text-base text-neutral-500 italic">
            Salary: Not Disclosed
          </p>
        )}

        <div className="mt-4 border-t border-neutral-200 pt-4 flex flex-col space-y-3 text-sm text-neutral-600">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{location}</span>
          </div>
          {job.jobLevel && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-5.747-6.99H17.747" />
              </svg>
              <span>{job.jobLevel}</span>
            </div>
          )}
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Posted on {formatDate(job.postedDate)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {(job.tags || []).map((tag) => (
            <span key={tag} className="bg-secondary-light text-secondary-dark text-sm font-medium px-3 py-1 rounded-md">
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
