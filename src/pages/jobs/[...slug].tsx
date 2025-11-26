
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting, SerializedJobPosting } from '@/lib/types';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import Head from 'next/head';
import { NEW_JOB_THRESHOLD_MS, PSEO_MIN_JOB_COUNT } from '@/lib/constants';
import { calculateSalaryInsights, SalaryInsight, getRelatedEntities } from '@/lib/seoUtils';
import Breadcrumbs, { Breadcrumb } from '@/components/Breadcrumbs';
import SalaryInsights from '@/components/SalaryInsights';
import RelatedSearches from '@/components/RelatedSearches';
import ZeroResults from '@/components/ZeroResults';

interface IParams extends ParsedUrlQuery {
  slug: string[];
}

interface ProgrammaticJobPageProps {
  jobs: SerializedJobPosting[];
  title: string;
  description: string;
  canonicalUrl: string;
  salaryInsight: SalaryInsight | null;
  relatedEntities: { type: 'skill' | 'location'; value: string }[];
  breadcrumbs: Breadcrumb[];
  noIndexPage: boolean;
}

const ProgrammaticJobPage: NextPage<ProgrammaticJobPageProps> = ({ jobs, title, description, canonicalUrl, salaryInsight, relatedEntities, breadcrumbs, noIndexPage }) => {
  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        {noIndexPage && <meta name="robots" content="noindex" />}
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumbs crumbs={breadcrumbs} />
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-6 break-words">{title}</h1>
        
        <SalaryInsights insight={salaryInsight} />
        <RelatedSearches entities={relatedEntities} />

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-8">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <ZeroResults />
        )}
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<ProgrammaticJobPageProps, IParams> = async (context) => {
  const { slug } = context.params as IParams;

  if (!slug || slug.length === 0 || slug.length % 2 !== 0) {
    return { notFound: true };
  }

  const { adminDb } = await getFirebaseAdmin();
  const jobsCollection = adminDb.collection('jobs');
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = jobsCollection.where('status', '==', 'published');

  const titleParts: string[] = [];
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: '/', isCurrent: false },
    { label: 'Jobs', href: '/', isCurrent: false },
  ];

  for (let i = 0; i < slug.length; i += 2) {
    const dimension = slug[i];
    const value = slug[i + 1];
    const decodedValue = decodeURIComponent(value);

    const isLast = i + 2 >= slug.length;
    const breadcrumbUrl = `/jobs/${slug.slice(0, i + 2).join('/')}`;
    
    breadcrumbs.push({ label: dimension.charAt(0).toUpperCase() + dimension.slice(1), href: '#', isCurrent: false });
    breadcrumbs.push({ label: decodedValue, href: breadcrumbUrl, isCurrent: isLast });

    switch (dimension) {
      case 'skill':
        query = query.where('tags', 'array-contains', decodedValue.toLowerCase());
        titleParts.push(`${decodedValue} Jobs`);
        break;
      case 'location':
        query = query.where('location', '==', decodedValue);
        titleParts.push(`in ${decodedValue}`);
        break;
      default:
        return { notFound: true };
    }
  }

  const pageTitle = titleParts.join(' ') || 'AI Jobs';
  const pageDescription = `Find the latest ${pageTitle}.`;

  const snapshot = await query.orderBy('postedDate', 'desc').get();
  const jobs: FirestoreJobPosting[] = [];
  snapshot.forEach((doc) => {
    jobs.push({ id: doc.id, ...doc.data() } as FirestoreJobPosting);
  });

  const now = new Date();
  const serializedJobs = jobs.reduce<SerializedJobPosting[]>((acc, job) => {
    const postedDate = job.postedDate?.toDate() ?? null;
    const expirationDate = job.expirationDate?.toDate() ?? null;

    if (expirationDate && expirationDate.getTime() < now.getTime()) {
      return acc;
    }

    acc.push({
      ...job,
      postedDate: postedDate ? postedDate.toISOString() : null,
      expirationDate: expirationDate ? expirationDate.toISOString() : null,
      verificationDate: job.verificationDate?.toDate()?.toISOString() ?? null,
      isNew: postedDate ? now.getTime() - postedDate.getTime() < NEW_JOB_THRESHOLD_MS : false,
    });
    return acc;
  }, []);

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${slug.join('/')}`;
  const salaryInsight = calculateSalaryInsights(serializedJobs);
  // Use the primary (first) dimension/value for related entity search
  const relatedEntities = getRelatedEntities(serializedJobs, slug[0], slug[1]);
  const noIndexPage = serializedJobs.length < PSEO_MIN_JOB_COUNT;

  return {
    props: {
      jobs: serializedJobs,
      title: pageTitle,
      description: pageDescription,
      canonicalUrl,
      salaryInsight,
      relatedEntities,
      breadcrumbs,
      noIndexPage,
    },
    revalidate: 3600,
  };
};

export default ProgrammaticJobPage;
