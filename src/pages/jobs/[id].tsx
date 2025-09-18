import Layout from '@/components/Layout';
import { getJobs, getJobById } from '@/lib/firestoreClient';
import { SerializedJobPosting } from '@/lib/types';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { formatDate } from '@/lib/dateUtils';
import AdContainer from '@/components/AdContainer';
import Image from 'next/image';

interface JobDetailsProps {
  job: SerializedJobPosting;
}

const JobDetails: NextPage<JobDetailsProps> = ({ job }) => {
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
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`} />
      </Head>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-x-12">
          {/* Main Content */}
          <div className="md:col-span-2">
            <article>
              <header className="mb-10 border-b border-neutral-200 pb-8">
                <div className="flex items-start space-x-6 mb-6">
                  {/* Logo or Fallback */}
                  <div className="flex-shrink-0 w-24 h-24 bg-neutral-100 rounded-xl flex items-center justify-center border border-neutral-200">
                    {job.companyLogoUrl ? (
                      <Image 
                        src={job.companyLogoUrl}
                        alt={`${job.company} logo`}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-dark">{
                        job.company
                          .split(' ')
                          .map(word => word[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Title and Company */}
                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark leading-tight mb-3">
                      {job.title}
                    </h1>
                    <div className="text-2xl text-neutral-700">
                      {job.company}
                    </div>
                  </div>
                </div>

                <hr className="border-t border-neutral-300 my-8" />
                {job.salaryRange ? (
                  <div className="mt-4 text-2xl text-emerald-700 font-semibold">
                    {job.salaryRange}
                  </div>
                ) : (
                  <div className="mt-4 text-lg text-neutral-500 italic">
                    Salary: Not Disclosed
                  </div>
                )}
                <div className="mt-6 flex flex-col space-y-3 text-lg text-neutral-600">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{job.location}</span>
                  </div>
                  {job.jobLevel && (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-5.747-6.99H17.747" />
                      </svg>
                      <span>{job.jobLevel}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-neutral-500 mt-4">
                  Posted on {formatDate(job.postedDate)}
                  {job.expirationDate && (
                    <span className="ml-4">Expires on {formatDate(job.expirationDate)}</span>
                  )}
                </div>
              </header>

              <section className="prose prose-lg max-w-none mx-auto job-description">
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

              {/* Story Behind the Role */}
              {job.story_answer1 != null && (
                <section className="my-12 md:my-16">
                  <div className="p-6 md:p-8 bg-secondary/5 rounded-lg border-l-4 border-secondary">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-dark mb-8">The Story Behind the Role</h2>
                    <div className="space-y-8">
                      {job.story_question1 && job.story_answer1 != null && (
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold font-serif text-primary/90">
                            {job.story_question1}
                          </h3>
                          <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                            {job.story_answer1}
                          </p>
                        </div>
                      )}
                      {job.story_question2 && job.story_answer2 != null && (
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold font-serif text-primary/90">
                            {job.story_question2}
                          </h3>
                          <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                            {job.story_answer2}
                          </p>
                        </div>
                      )}
                      {job.story_question3 && job.story_answer3 != null && (
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold font-serif text-primary/90">
                            {job.story_question3}
                          </h3>
                          <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                            {job.story_answer3}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {job.source && (
                <div className="mt-10 pt-6 border-t border-neutral-200 text-sm text-neutral-500">
                  <p>
                    This job description has been reformatted for clarity by AI Job Spot.
                    <a href={job.source} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:text-primary-dark underline">
                      View the original source posting.
                    </a>
                  </p>
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-3">
                {(job.tags || []).map((tag) => (
                  <span key={tag} className="bg-secondary-light text-secondary-dark text-sm font-medium px-3 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="my-12">
                {job.applicationExperience != null && (
                  <div className="mb-6 p-4 bg-neutral-100 border border-neutral-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-2">Application Insights</h3>
                    <p className="text-neutral-600">{job.applicationExperience}</p>
                  </div>
                )}
                <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary-dark hover:bg-primary text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg">
                  Apply Now
                </a>
              </div>

              <div className="my-12">
                <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_JOB_CONTENT_SLOT || ''} />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-1">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`"${job.company}" careers`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block sticky top-24 bg-neutral-50 border border-neutral-200 rounded-lg p-6 hover:bg-neutral-100 hover:border-neutral-300 transition-all duration-200"
            >
              <h3 className="text-xl font-serif font-semibold text-primary-dark mb-4 flex items-center">
                Company Research
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </h3>
              <ul className="space-y-3">
                {job.glassdoorLink != null && (
                  <li>
                    <a href={job.glassdoorLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark underline transition-colors" onClick={(e) => e.stopPropagation()}>
                      Glassdoor Reviews
                    </a>
                  </li>
                )}
                {job.crunchbaseLink != null && (
                  <li>
                    <a href={job.crunchbaseLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark underline transition-colors" onClick={(e) => e.stopPropagation()}>
                      Crunchbase Profile
                    </a>
                  </li>
                )}
              </ul>
              <p className="text-xs text-neutral-400 mt-4">
                Click to research this company on Google. Links inside this box open separately.
              </p>
            </a>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default JobDetails;

export const getStaticPaths: GetStaticPaths = async () => {
  const { jobs } = await getJobs();
  const paths = jobs.map((job) => ({
    params: { id: job.id! },
  }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<JobDetailsProps, { id: string }> = async (context) => {
  const id = context.params?.id;

  if (!id) {
    return { notFound: true };
  }

  const job = await getJobById(id);

  if (!job || job.status !== 'published') {
    return { notFound: true };
  }

  // Ensure all data is correctly serialized and defaulted
  const serializedJob: SerializedJobPosting = {
    ...job,
    id: job.id!,
    postedDate: job.postedDate.toISOString(),
    expirationDate: job.expirationDate ? job.expirationDate.toISOString() : null,
    salaryRange: job.salaryRange ?? null,
    tags: job.tags ?? [],
    description: job.description ?? '',
    responsibilities: job.responsibilities ?? [],
    qualifications: job.qualifications ?? [],
    preferredQualifications: job.preferredQualifications ?? [],
    jobLevel: job.jobLevel ?? null,
    employeeRole: job.employeeRole ?? null,
    companyLogoUrl: job.companyLogoUrl ?? null,
    applicationExperience: job.applicationExperience ?? null,
    glassdoorLink: job.glassdoorLink ?? null,
    crunchbaseLink: job.crunchbaseLink ?? null,
    source: job.source ?? null,
    story_question1: job.story_question1 ?? null,
    story_answer1: job.story_answer1 ?? null,
    story_question2: job.story_question2 ?? null,
    story_answer2: job.story_answer2 ?? null,
    story_question3: job.story_question3 ?? null,
    story_answer3: job.story_answer3 ?? null,
  };

  return {
    props: {
      job: serializedJob,
    },
    revalidate: 60, // Re-generate the page every 60 seconds
  };
};
