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
const JobCard = ({ job }: JobCardProps) => {
  const { id, title, company, location, salaryRange, expirationDate, isNew } = job;

  const now = new Date();

  let daysUntilExpiration: number | null = null;
  if (expirationDate) {
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const showExpiresSoon = daysUntilExpiration !== null && daysUntilExpiration > 0 && daysUntilExpiration <= EXPIRES_SOON_THRESHOLD_DAYS;

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

        <div className="mt-4 flex items-center text-neutral-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-base">{location}</span>
        </div>

        {expirationDate && (
          <div className="mt-4 flex items-center text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              {daysUntilExpiration !== null && daysUntilExpiration > 0
                ? showExpiresSoon
                  ? `Expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`
                  : `Expires on ${formatDate(expirationDate)}`
                : 'Expired'}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {(job.tags || []).map((tag) => (
            <span key={tag} className="bg-secondary-light text-secondary-dark text-sm font-medium px-3 py-1 rounded-md">
              {tag}
            </span>
          ))}
          {salaryRange && (
            <span key={salaryRange} className="bg-accent-light text-accent-dark text-sm font-medium px-3 py-1 rounded-md">
              {salaryRange}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
