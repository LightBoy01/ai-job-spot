import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getAllTags } from '@/lib/firestoreClient';
import AdContainer from '@/components/AdContainer';

interface TagsPageProps {
  tags: string[];
}

const TagsPage: NextPage<TagsPageProps> = ({ tags }) => {
  return (
    <Layout>
      <Head>
        <title>All Thematic Hubs | AI Job Spot</title>
        <meta
          name="description"
          content="Explore all thematic hubs and categories related to AI jobs and articles."
        />
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="page-title text-4xl sm:text-5xl md:text-6xl mb-8">
          All Thematic Hubs
        </h1>
        <div className="flex flex-wrap gap-4">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                passHref
                className="block w-full sm:w-auto"
              >
                <div className="h-full bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out border border-neutral-200/80 hover:border-secondary/50 text-center sm:text-left">
                  <h2 className="text-xl font-serif font-bold text-primary-dark group-hover:text-secondary-dark transition-colors">
                    #{tag}
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1 font-sans">
                    Explore Hub &rarr;
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-neutral-600">No thematic hubs found yet.</p>
          )}
        </div>
        <div className="mt-12">
           <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT || ''} />
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<TagsPageProps> = async () => {
  const tags = await getAllTags();

  return {
    props: {
      tags,
    },
    revalidate: 60, // Re-generate this page every 60 seconds
  };
};

export default TagsPage;
