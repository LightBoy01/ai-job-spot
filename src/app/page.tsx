import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import { getJobs } from '@/lib/firebase';
import { JobPosting } from '@/lib/types';

/**
 * The home page of the application.
 * It displays a list of the latest job postings fetched from Firestore at build time.
 * This is an async Server Component, fetching data directly.
 *
 * @returns {JSX.Element} The rendered HomePage component.
 */
export default async function HomePage() {
  let jobs: JobPosting[] = [];
  try {
    jobs = await getJobs();
  } catch (error) {
    console.error("Error fetching jobs in HomePage:", error);
    // In a real application, you might want to display an error message to the user
    // or log to an error tracking service.
  }

  return (
    // Pass page-specific title and description to the Layout for optimal SEO.
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Latest AI Jobs
        </h1>

        {/* Check if there are jobs to display, otherwise show a message. */}
        {jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No jobs posted yet. Check back soon!</p>
        )}
      </div>
    </Layout>
  );
}

// This tells Next.js to re-generate this page in the background at most
// once every 60 seconds. This keeps the job list fresh without
// sacrificing the speed of a static site. It's the perfect balance
// for SEO (bots see a fully rendered page) and performance (users get a
// fast, cached page).
export const revalidate = 60;