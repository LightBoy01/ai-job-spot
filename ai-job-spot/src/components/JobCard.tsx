import Link from 'next/link';
import { JobPosting } from '@/lib/types';

interface JobCardProps {
  job: JobPosting;
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
  // Destructure all expected properties for clarity
  const { id, title, company, location, salaryRange } = job;

  return (
    // Wrap the entire card in a Next.js Link component for SEO and UX.
    // The `passHref` and `legacyBehavior` props ensure the <a> tag is generated correctly.
    <Link href={`/jobs/${id}`} passHref className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer">
        <div className="flex flex-col">
          {/* Job Title */}
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>

          {/* Company Name */}
          <p className="mt-1 text-md text-gray-700">
            {company}
          </p>

          {/* Location */}
          <div className="mt-4 flex items-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{location}</span>
          </div>

          {/* Job Tags (Type and Salary) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {job.tags.map((tag) => (
              <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {salaryRange && (
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {salaryRange}
              </span>
            )}
          </div>
        </div>
    </Link>
  );
};

export default JobCard;
