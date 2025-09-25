import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getAllTags } from '@/lib/firestoreClient';

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
              <Link key={tag} href={`/tags/${tag}`} passHref>
                <span className="inline-block bg-primary-light text-primary-dark px-6 py-3 rounded-full text-lg font-semibold hover:bg-primary transition-colors hover:text-white shadow-md">
                  #{tag}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-neutral-600">No thematic hubs found yet.</p>
          )}
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
