import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import AdContainer from '@/components/AdContainer';
import { getJobs } from '@/lib/firebase';
import { JobPosting } from '@/lib/types';
import { GetStaticProps } from 'next';
import Head from 'next/head';

interface HomeProps {
  jobs: JobPosting[];
}

export default function Home({ jobs }: HomeProps) {
  return (
    <Layout>
      <Head>
        <title>AI Job Spot | Your Hub for the Latest AI Job Opportunities</title>
        <meta
          name="description"
          content="Find the latest and most promising AI job opportunities, from machine learning engineers to data scientists. Your next career move in artificial intelligence starts here."
        />
        <meta name="keywords" content="AI jobs, artificial intelligence jobs, machine learning jobs, data scientist jobs, AI careers" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="AI Job Spot | Your Hub for the Latest AI Job Opportunities" />
        <meta property="og:description" content="Find the latest and most promising AI job opportunities, from machine learning engineers to data scientists. Your next career move in artificial intelligence starts here." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.ai-job-spot.com" /> 
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="lg:text-5xl md:text-4xl text-3xl font-serif font-bold text-primary-dark mb-12 text-center leading-tight !text-center">Latest AI Job Opportunities</h1>
        {jobs.length === 0 ? (
          <p className="text-center text-gray-600">No job postings available at the moment. Please check back later!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {jobs.map((job, index) => (
              <>
                <JobCard key={job.id} job={job} />
                {(index + 1) % 3 === 0 && index !== jobs.length - 1 && (
                  <div className="lg:col-span-3">
                    <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_JOB_LISTING_SLOT || ''} />
                  </div>
                )}
              </>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let jobs: JobPosting[] = [];
  try {
    jobs = await getJobs();
    // Sort jobs by postedDate in descending order (newest first)
    jobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  } catch (error) {
    console.error("Error fetching jobs:", error);
  }

  return {
    props: {
      jobs: JSON.parse(JSON.stringify(jobs)), // Serialize Date objects
    },
    revalidate: 60, // In seconds
  };
};
