// Forcing a re-deployment to clear cache
import Layout from '@/components/Layout';
import {
  getJobs,
  getJobById,
  getRelevantArticles,
  getArticlesByIds,
  getSalaryStats,
} from '@/lib/firestoreAdminClient';
import { SerializedJobPosting, SerializedArticle } from '@/lib/types';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { formatDate } from '@/lib/dateUtils';
import AdContainer from '@/components/AdContainer';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import FeaturedBadge from '@/components/FeaturedBadge'; // New import
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import DOMPurify from 'isomorphic-dompurify';
import Icon from '@/components/Icon';
import Breadcrumbs, { Breadcrumb } from '@/components/Breadcrumbs';
import SalaryInsights from '@/components/SalaryInsights';

interface JobDetailsProps {
  job: SerializedJobPosting;
  relevantArticles: SerializedArticle[];
  salaryStats?: {
    min: number;
    max: number;
    avg: number;
    count: number;
    currency: string;
  } | null;
  currentJobSalaryValue?: number | null;
}

const generateJobPostingSchema = (job: SerializedJobPosting) => {
  const plainDescription = job.description.replace(/<[^>]*>?/gm, '');

  const fullDescription = `
    ${plainDescription}
    
    Responsibilities:
    ${job.responsibilities?.join('\n')}
    
    Qualifications:
    ${job.qualifications?.join('\n')}
  `.trim();

  const employmentTypes = [
    'full-time',
    'part-time',
    'contract',
    'temporary',
    'internship',
  ];
  const employmentType =
    job.tags?.find((tag) => employmentTypes.includes(tag.toLowerCase())) ||
    'OTHER';

  const locationParts = job.location.split(',').map((part) => part.trim());
  const jobLocation = job.location.toLowerCase().includes('remote')
    ? {
        '@type': 'Place',
        remote: true,
      }
    : {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: locationParts[0],
          addressRegion: locationParts[1],
          addressCountry: locationParts[2],
        },
      };

  let salary = {};
  if (job.salaryRange) {
    const currencyMatch = job.salaryRange.match(/[A-Z]{3}|[$€₹£]/);
    const currency = currencyMatch ? currencyMatch[0] : 'USD';
    const numbers = job.salaryRange.match(/\d+/g)?.map(Number);
    if (numbers && numbers.length > 0) {
      salary = {
        '@type': 'MonetaryAmount',
        currency: currency,
        value: {
          '@type': 'QuantitativeValue',
          unitText: 'YEAR',
          minValue: numbers[0],
          maxValue: numbers.length > 1 ? numbers[1] : numbers[0],
        },
      };
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: fullDescription,
    identifier: {
      '@type': 'PropertyValue',
      name: 'AI Job Spot',
      value: job.id,
    },
    datePosted: job.postedDate,
    validThrough: job.expirationDate,
    employmentType: employmentType.toUpperCase(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      logo: job.companyLogoUrl,
    },
    jobLocation: jobLocation,
    baseSalary: Object.keys(salary).length > 0 ? salary : undefined,
  };
};

const generateBreadcrumbSchema = (job: SerializedJobPosting) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aijobspot.online';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Jobs',
        item: siteUrl, // Currently our home is the jobs list
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: job.title,
        item: `${siteUrl}/jobs/${job.id}`,
      },
    ],
  };
};

const JobDetails: NextPage<JobDetailsProps> = ({ job, relevantArticles, salaryStats, currentJobSalaryValue }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleApplyClick = () => {
    if (job.source) {
      setIsModalOpen(true);
    } else {
      window.open(job.applicationLink, '_blank');
    }
  };

  if (!job) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold">Job not found</h1>
          <p className="mt-4">
            The job posting you are looking for does not exist or has expired.
          </p>
        </div>
      </Layout>
    );
  }

  // Sanitize HTML content before rendering to prevent XSS
  const sanitizedDescription = DOMPurify.sanitize(job.description);
  const sanitizedCulture = job.companyCulture ? DOMPurify.sanitize(job.companyCulture) : '';

  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: '/', isCurrent: false },
    { label: 'Jobs', href: '/', isCurrent: false },
    { label: job.title, href: `/jobs/${job.id}`, isCurrent: true },
  ];

  return (
    <Layout>
      <Head>
        <title>{`${job.title} at ${job.company} | AI Job Spot`}</title>
        <meta
          name="description"
          content={job.description.replace(/<[^>]*>?/gm, '')}
        />
        <meta
          name="keywords"
          content={`${job.title}, ${job.company}, ${job.location}, AI jobs, artificial intelligence careers`}
        />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content={`${job.title} at ${job.company} | AI Job Spot`}
        />
        <meta
          property="og:description"
          content={job.description.replace(/<[^>]*>?/gm, '')}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJobPostingSchema(job)),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema(job)),
          }}
        />
      </Head>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Breadcrumbs crumbs={breadcrumbs} />
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-x-12">
          {/* Main Content */}
          <div className="md:col-span-2 min-w-0">
              <article className="break-words">
                  <header className={`mb-10 border-b border-neutral-200 pb-8 ${job.isFeatured ? 'bg-amber-50/50 p-6 rounded-lg border-2 border-amber-500 ring-2 ring-amber-300' : ''}`}>
                    <div className="flex items-start space-x-6 mb-6">                  {/* Logo or Fallback */}
                  <div className="flex-shrink-0 w-24 h-24 bg-white rounded-xl flex items-center justify-center border-2 border-neutral-200 shadow-sm p-2">
                    {job.companyLogoUrl ? (
                      <Image
                        src={`/api/image-proxy?url=${encodeURIComponent(job.companyLogoUrl)}`}
                        alt={`${job.company} logo`}
                        width={88}
                        height={88}
                        className="object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-dark">
                        {job.company
                          .split(' ')
                          .map((word) => word[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Title and Company */}
                  <div className="flex-1 pt-2 min-w-0">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-primary-dark leading-tight mb-2 break-words whitespace-normal">
                      {job.title}
                      {job.isFeatured && (
                        <span className="ml-4 inline-block align-middle">
                          <FeaturedBadge />
                        </span>
                      )}
                    </h1>
                    <div className="text-2xl text-neutral-700 font-light">
                      at {job.company}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-8 pt-6 border-t border-neutral-200/80">
                  {job.salaryRange ? (
                    <div className="flex items-center">
                      <Icon name="salary" className="h-7 w-7 mr-3 text-accent" />
                      <span className="text-xl text-accent-dark font-semibold">{job.salaryRange}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                       <Icon name="salary" className="h-7 w-7 mr-3 text-neutral-400" />
                      <span className="text-lg text-neutral-500 italic">Salary Not Disclosed</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Icon name="location" className="h-7 w-7 mr-3 text-accent" />
                    <span className="text-xl text-neutral-700">{job.location}</span>
                  </div>
                </div>

                <div className="text-sm text-neutral-500 mt-6">
                  {job.postedDate && `Posted on ${formatDate(job.postedDate)}`}
                  {job.expirationDate && (
                    <span className="ml-4">
                      Expires on {formatDate(job.expirationDate)}
                    </span>
                  )}
                </div>
              </header>

              {/* Salary Insights */}
              <SalaryInsights insight={salaryStats || null} currentJobSalary={currentJobSalaryValue} />

              {/* Story Behind the Role */}
              <section className="my-12 md:my-16">
                <div className="p-8 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg border-l-4 border-secondary shadow-lg">
                  <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6 flex items-center">
                    <Icon name="story" className="h-8 w-8 mr-4 text-secondary" />
                    The Story Behind the Role
                  </h2>
                  {job.story_answer1 != null ? (
                    <div className="space-y-8 pl-12 border-l-2 border-secondary/20 ml-4">
                      {job.story_question1 && job.story_answer1 != null && (
                        <div>
                          <h3 className="text-xl font-semibold font-serif text-primary/90">
                            {job.story_question1}
                          </h3>
                          <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                            {job.story_answer1}
                          </p>
                        </div>
                      )}
                      {job.story_question2 && job.story_answer2 != null && (
                        <div>
                          <h3 className="text-xl font-semibold font-serif text-primary/90">
                            {job.story_question2}
                          </h3>
                          <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                            {job.story_answer2}
                          </p>
                        </div>
                      )}
                      {job.story_question3 && job.story_answer3 != null && (
                        <div>
                          <h3 className="text-xl font-semibold font-serif text-primary/90">
                            {job.story_question3}
                          </h3>
                          <p className="mt-2 text-neutral-700 prose prose-lg max-w-none">
                            {job.story_answer3}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-neutral-600 italic pl-12">
                      This job posting does not yet have the &quot;Story Behind
                      the Role&quot; section. Check back later for more
                      insights!
                    </p>
                  )}
                </div>
              </section>

              <section className="prose prose-base sm:prose-lg mx-auto">
                <div
                  className="prose prose-base sm:prose-lg mx-auto overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />

                {job.responsibilities && job.responsibilities.length > 0 && (
                  <>
                    <h2 className="text-3xl font-serif font-semibold text-primary-dark mt-12 mb-6">
                      What You&apos;ll Do
                    </h2>
                    <ul className="list-disc pl-5 space-y-2">
                      {job.responsibilities.map((item, index) => (
                        <li key={index} className="break-words">{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {job.qualifications && job.qualifications.length > 0 && (
                  <>
                    <h2 className="text-3xl font-serif font-semibold text-primary-dark mt-12 mb-6">
                      What You&apos;ll Need
                    </h2>
                    <ul className="list-disc pl-5 space-y-2">
                      {job.qualifications.map((item, index) => (
                        <li key={index} className="break-words">{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {job.preferredQualifications &&
                  job.preferredQualifications.length > 0 && (
                    <>
                      <h3 className="text-2xl font-serif font-semibold text-primary-dark mt-10 mb-6">
                        Preferred Qualifications
                      </h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {job.preferredQualifications.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}
              </section>

              {/* Company Culture Section */}
              {job.companyCulture && (
                <section className="my-12 md:my-16">
                  <div className="p-8 bg-neutral-50 rounded-lg border-l-4 border-neutral-300">
                    <h2 className="text-3xl font-serif font-bold text-primary-dark mb-6 flex items-center">
                       <Icon name="culture" className="h-8 w-8 mr-4 text-neutral-500" />
                      Our Culture
                    </h2>
                    <div
                      className="prose prose-lg max-w-none text-neutral-700 pl-12 border-l-2 border-neutral-200 ml-4"
                      dangerouslySetInnerHTML={{ __html: sanitizedCulture }}
                    />
                  </div>
                </section>
              )}

              <div className="my-12">
                {job.applicationExperience != null && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                      <Icon name="info" className="h-6 w-6 mr-3" />
                      Application Insights
                    </h3>
                    <p className="text-blue-700 pl-9">
                      {job.applicationExperience}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleApplyClick}
                  className="inline-block bg-primary-dark hover:bg-primary text-white font-serif font-semibold py-4 px-10 rounded-lg transition-all duration-300 ease-in-out text-lg shadow-md hover:shadow-lg transform hover:-translate-y-px"
                >
                  Apply Now
                </button>
              </div>

              <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => window.open(job.applicationLink, '_blank')}
                title="External Application"
                message={`You are about to leave AI Job Spot to apply at ${job.source}. This is an external listing, and the application process may differ.`}
                confirmText="Proceed to Apply"
                confirmButtonClassName="bg-primary text-white hover:bg-primary-dark"
              />

              <div className="mt-10 flex flex-wrap gap-2">
                {(job.tags || []).map((tag) => (
                  <Link
                    href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                    key={tag}
                    className="border border-secondary/30 bg-secondary/10 text-secondary-dark text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-secondary-dark hover:text-white transition-colors duration-200"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              <div className="my-12">
                <AdContainer
                  slot={process.env.NEXT_PUBLIC_ADSENSE_JOB_CONTENT_SLOT || ''}
                />
              </div>

              {/* --- DYNAMIC PROVENANCE TRAIL --- */}
              {(job.source || job.verificationDate) && (
                <section className="my-16">
                  <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-6">
                    <h3 className="text-xl font-serif font-semibold text-primary-dark mb-4 flex items-center">
                      <Icon name="provenance" className="h-6 w-6 mr-3 text-neutral-500" />
                      Provenance Trail
                    </h3>
                    <p className="text-sm text-neutral-600 mb-5 pl-9">
                      To ensure authenticity, we track the origin and
                      verification history of our listings.
                    </p>
                    <ul className="text-sm space-y-4 text-neutral-800">
                      {job.source && (
                        <li className="grid grid-cols-[auto,1fr] gap-x-3 items-start">
                          <Icon name="source-alt" className="h-5 w-5 mt-0.5 text-secondary" />
                          <div>
                            <strong className="font-semibold">Source:</strong>
                            <span className="ml-2 font-mono bg-neutral-200 px-2 py-1 rounded-md text-xs">{job.source}</span>
                          </div>
                        </li>
                      )}
                      
                      {job.verificationHistory && job.verificationHistory.length > 0 ? (
                        <li className="grid grid-cols-[auto,1fr] gap-x-3 items-start">
                          <Icon name="calendar" className="h-5 w-5 mt-0.5 text-secondary" />
                          <div>
                            <strong className="font-semibold">Verification History:</strong>
                            <ul className="mt-2 space-y-2 border-l-2 border-secondary/30 pl-3">
                              {job.verificationHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map((event, idx) => (
                                <li key={idx} className="text-xs text-neutral-600">
                                  <div className="font-medium text-neutral-800">{formatDate(event.date)}</div>
                                  <div className="text-neutral-500">
                                    Verified via <span className="font-semibold text-secondary-dark">{event.type}</span> check
                                    {event.verifier ? ` by ${event.verifier}` : ''}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </li>
                      ) : (
                        job.verificationDate && (
                          <li className="grid grid-cols-[auto,1fr] gap-x-3 items-start">
                            <Icon name="calendar" className="h-5 w-5 mt-0.5 text-secondary" />
                            <div>
                              <strong className="font-semibold">Last Verified:</strong>
                              <span className="ml-2 font-medium">
                                {formatDate(job.verificationDate)}
                              </span>
                            </div>
                          </li>
                        )
                      )}

                      {job.sourceUrl && (
                        <li className="grid grid-cols-[auto,1fr] gap-x-3 items-start">
                          <Icon name="source" className="h-5 w-5 mt-0.5 text-secondary" />
                          <div>
                            <strong className="font-semibold">Original Posting:</strong>
                            <a
                              href={job.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-primary hover:underline font-medium"
                            >
                              View Original
                            </a>
                          </div>
                        </li>
                      )}
                    </ul>

                    <div className="mt-6 pt-4 border-t border-secondary/20">
                      <button
                        onClick={() => window.open(`mailto:support@aijobspot.com?subject=Report Closed Job: ${job.id}&body=I found an issue with this job listing: ${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${job.id}`, '_blank')}
                        className="text-xs text-neutral-500 hover:text-red-600 flex items-center transition-colors group"
                      >
                        <Icon name="flag" className="h-4 w-4 mr-1.5 group-hover:text-red-600" />
                        Report this job as closed or incorrect
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </article>
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-8">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `"${job.company}" careers`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-primary/5 border border-primary/10 rounded-lg p-6 hover:bg-primary/10 hover:border-primary/20 transition-all duration-300"
              >
                <h3 className="text-xl font-serif font-semibold text-primary-dark mb-4 flex items-center">
                  Company Research
                  <Icon name="external-link" className="h-5 w-5 inline-block ml-2 text-neutral-500" />
                </h3>
                <ul className="space-y-3">
                  {job.glassdoorLink != null && (
                    <li>
                      <a
                        href={job.glassdoorLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Glassdoor Reviews
                      </a>
                    </li>
                  )}
                  {job.crunchbaseLink != null && (
                    <li>
                      <a
                        href={job.crunchbaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Crunchbase Profile
                      </a>
                    </li>
                  )}
                </ul>
                <p className="text-xs text-neutral-400 mt-4">
                  Click to research this company on Google. Links inside this
                  box open separately.
                </p>
              </a>

              <Sidebar title="Related Articles" items={relevantArticles} />
            </div>
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

export const getStaticProps: GetStaticProps<
  JobDetailsProps,
  { id: string }
> = async (context) => {
  const id = context.params?.id;

  if (!id) {
    return { notFound: true };
  }

  const job = await getJobById(id);

  if (!job || job.status !== 'published') {
    return { notFound: true };
  }

  let relevantArticles: SerializedArticle[] = [];

  if (job.relatedArticleIds && job.relatedArticleIds.length > 0) {
    const articles = await getArticlesByIds(job.relatedArticleIds);
    relevantArticles = articles.map((article) => ({
      ...article,
      publishDate: article.publishDate ? article.publishDate.toISOString() : '',
      issueNo: article.issueNo ?? null,
      volumeNo: article.volumeNo ?? null,
    }));
  }
  
  // Fallback if no pre-computed relationships exist
  if (relevantArticles.length === 0) {
    const articles = await getRelevantArticles(job.tags || [], job.id!);
    relevantArticles = articles.map((article) => ({
      ...article,
      publishDate: article.publishDate ? article.publishDate.toISOString() : '',
      issueNo: article.issueNo ?? null,
      volumeNo: article.volumeNo ?? null,
    }));
  }

  // Ensure all data is correctly serialized and defaulted
  const serializedJob: SerializedJobPosting = {
    ...job,
    id: job.id!,
    postedDate: job.postedDate ? job.postedDate.toISOString() : null,
    expirationDate: job.expirationDate
      ? job.expirationDate.toISOString()
      : null,
    verificationDate: job.verificationDate
      ? job.verificationDate.toISOString()
      : null,
    verificationHistory: job.verificationHistory?.map(event => ({
      date: event.date.toISOString(),
      type: event.type,
      verifier: event.verifier ?? null,
      note: event.note ?? null,
    })) ?? [],
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
    companyCulture: job.companyCulture ?? null,
  };

  const salaryStats = await getSalaryStats(job.title);

  let currentJobSalaryValue = null;
  if (job.salaryRange) {
    const numbers = job.salaryRange.match(/\d+/g)?.map(Number);
    if (numbers && numbers.length > 0) {
      // Handle "150k" case: if value < 1000, assume k.
      const val = numbers[0] < 1000 ? numbers[0] * 1000 : numbers[0];
      // If range, take avg
      if (numbers.length > 1) {
        const val2 = numbers[1] < 1000 ? numbers[1] * 1000 : numbers[1];
        currentJobSalaryValue = (val + val2) / 2;
      } else {
        currentJobSalaryValue = val;
      }
    }
  }

  if (id === '01118332cc3aeb166f1c5fcc027578db4d57a573ecfd96289b632e14fad2c42a') {
    // Debug block removed
  }

  return {
    props: {
      job: serializedJob,
      relevantArticles: relevantArticles.map((article) => ({
        ...article,
        publishDate: article.publishDate ?? '',
        issueNo: article.issueNo ?? null,
        volumeNo: article.volumeNo ?? null,
      })),
      salaryStats: salaryStats || null,
      currentJobSalaryValue,
    },
    revalidate: 60, // Re-generate the page every 60 seconds
  };
};