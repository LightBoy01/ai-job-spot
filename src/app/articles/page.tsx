import Layout from '../components/Layout';
import Link from 'next/link';
import { db } from '../lib/firebase'; // Import the Firestore instance
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

/**
 * The articles page of the application.
 * It displays a list of educational articles fetched from Firestore at build time.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.articles - The array of article objects fetched from Firestore.
 * @returns {JSX.Element} The rendered ArticlesPage component.
 */
const ArticlesPage = ({ articles }) => {
  return (
    <Layout
      title="AI Articles & Guides | AI Job Spot"
      description="Explore articles and guides on AI careers, resume writing, interview tips, and more."
    >
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">
          AI Articles & Guides
        </h1>

        {articles && articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <Link href={`/articles/${article.slug}`} legacyBehavior>
                  <a className="block">
                    <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                      {article.title}
                    </h2>
                  </a>
                </Link>
                <p className="mt-2 text-gray-700 text-sm">
                  By {article.author} on {new Date(article.publishDate).toLocaleDateString()}
                </p>
                <p className="mt-4 text-gray-600">
                  {article.contentBody.substring(0, 150)}...
                </p>
                <Link href={`/articles/${article.slug}`} legacyBehavior>
                  <a className="mt-4 inline-block text-blue-600 hover:underline text-sm">
                    Read More
                  </a>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No articles published yet. Check back soon!</p>
        )}
      </div>
    </Layout>
  );
};

// This function runs at build time on the server to fetch article data.
export async function getStaticProps() {
  // Define the structure for an 'article' document in Firestore:
  // { title: string, author: string, publishDate: Timestamp, contentBody: string, slug: string }

  const articlesCollectionRef = collection(db, 'articles');
  const q = query(articlesCollectionRef, orderBy('publishDate', 'desc'));

  const querySnapshot = await getDocs(q);

  const articles = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    publishDate: doc.data().publishDate.toDate().toISOString(), // Convert Firestore Timestamp to ISO string
  }));

  return {
    props: {
      articles,
    },
    revalidate: 3600, // Re-generate at most once every hour (3600 seconds)
  };
}

export default ArticlesPage;
