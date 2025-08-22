import Layout from '@/components/Layout';
import { getJobs, getJobById } from '@/lib/firestoreClient';
import { SerializedJobPosting } from '@/lib/types';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { formatDate } from '@/lib/dateUtils';
import AdContainer from '@/components/AdContainer';

interface JobPageProps {
  job: SerializedJobPosting;
}

export default function JobPage({ job }: JobPageProps) {
  if (!job) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold">Job not found</h1>
          <p className="mt-4">The job posting you are looking for does not exist or has expired.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{`${job.title} at ${job.company} | AI Job Spot`}</title>
        <meta name="description" content={job.description} />
        <meta name="keywords" content={`${job.title}, ${job.company}, ${job.location}, AI jobs, artificial intelligence careers`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={`${job.title} at ${job.company} | AI Job Spot`} />
        <meta property="og:description" content={job.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`} />
      </Head>
      <article className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <header className="mb-10 border-b border-neutral-200 pb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark leading-tight mb-4">
            {job.title}
          </h1>
          <hr className="border-t border-neutral-300 my-8" /> {/* Added subtle divider */}
          <div className="text-xl text-neutral-700 mb-2">
            {job.company}
          </div>
          <div className="text-lg text-neutral-600">
            {job.location}
          </div>
          <div className="text-sm text-neutral-500 mt-4">
            Posted on {formatDate(job.postedDate)}
            {job.expirationDate && (
              <span className="ml-4">Expires on {formatDate(job.expirationDate)}</span>
            )}
          </div>
        </header>

        <section className="prose prose-lg max-w-none mx-auto job-description">
          {job.jobLevel && (
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark">JOB LEVEL</h2>
              <p>{job.jobLevel}</p>
            </div>
          )}
          {job.employeeRole && (
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-semibold text-primary-dark">EMPLOYEE ROLE</h2>
              <p>{job.employeeRole}</p>
            </div>
          )}

          <div className="prose prose-lg max-w-none mx-auto job-description" dangerouslySetInnerHTML={{ __html: job.description }} />

          {job.responsibilities && job.responsibilities.length > 0 && (
            <>
                <h2 className="text-3xl font-serif font-semibold text-primary-dark mt-12 mb-6">What You&apos;ll Do</h2>
                <ul className="list-disc pl-5 space-y-2">
                    {job.responsibilities.map((item, index) => (
                    <li key={index}>{item}</li>
                    ))}
                </ul>
            </>
          )}

          {job.qualifications && job.qualifications.length > 0 && (
            <>
                <h2 className="text-3xl font-serif font-semibold text-primary-dark mt-12 mb-6">What You&apos;ll Need</h2>
                <ul className="list-disc pl-5 space-y-2">
                    {job.qualifications.map((item, index) => (
                    <li key={index}>{item}</li>
                    ))}
                </ul>
            </>
          )}

          {job.preferredQualifications && job.preferredQualifications.length > 0 && (
            <>
              <h3 className="text-2xl font-serif font-semibold text-primary-dark mt-10 mb-6">Preferred Qualifications</h3>
              <ul className="list-disc pl-5 space-y-2">
                {job.preferredQualifications.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          {(job.tags || []).map((tag) => (
            <span key={tag} className="bg-secondary-light text-secondary-dark text-sm font-medium px-3 py-1 rounded-md">
              {tag}
            </span>
          ))}
          {job.salaryRange && (
            <span key={job.salaryRange} className="bg-accent-light text-accent-dark text-sm font-medium px-3 py-1 rounded-md">
              {job.salaryRange}
            </span>
          )}
        </div>

        <div className="my-12">
          <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary-dark hover:bg-primary text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg">
            Apply Now
          </a>
        </div>

        <div className="my-12">
          <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_JOB_CONTENT_SLOT || ''} />
        </div>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { jobs } = await getJobs();
  const paths = jobs.map((job) => ({
    params: { id: job.id! },
  }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<JobPageProps, { id: string }> = async (context) => {
  const id = context.params?.id;

  if (!id) {
    return { notFound: true };
  }

  const job = await getJobById(id);

  if (!job || job.status !== 'published') {
    return { notFound: true };
  }

  return {
    props: {
      job: {
        ...job,
        postedDate: job.postedDate.toISOString(),
        expirationDate: job.expirationDate ? job.expirationDate.toISOString() : null,
        salaryRange: job.salaryRange || null,
        tags: job.tags || [],
        description: job.description || '',
        responsibilities: job.responsibilities || [],
        qualifications: job.qualifications || [],
        preferredQualifications: job.preferredQualifications || [],
        jobLevel: job.jobLevel || null,
        employeeRole: job.employeeRole || null,
      } as SerializedJobPosting,
    },
    revalidate: 60,
  };
};