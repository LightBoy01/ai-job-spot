import Layout from '@/components/Layout';
import Link from 'next/link';
import { db } from '@/lib/firebase'; // Import the Firestore instance
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

interface Article {
  id: string;
  slug: string;
  title: string;
  author: string;
  publishDate: string; // ISO string for serialization
  contentBody: string;
}

/**
 * The articles page of the application.
 * It displays a list of educational articles fetched from Firestore at build time.
 * This is an async Server Component, fetching data directly.
 *
 * @returns {JSX.Element} The rendered ArticlesPage component.
 */
export default async function ArticlesPage() {
  let articles: Article[] = [];
  try {
    // Define the structure for an 'article' document in Firestore:
    // { title: string, author: string, publishDate: Timestamp, contentBody: string, slug: string }

    const articlesCollectionRef = collection(db, 'articles');
    const q = query(articlesCollectionRef, orderBy('publishDate', 'desc'));

    const querySnapshot = await getDocs(q);

    articles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      slug: doc.data().slug || doc.id, // Fallback for slug if not present
      title: doc.data().title,
      author: doc.data().author,
      publishDate: doc.data().publishDate?.toDate().toISOString() || new Date().toISOString(),
      contentBody: doc.data().contentBody || '',
    }));
  } catch (error) {
    console.error("Error fetching articles in ArticlesPage:", error);
    // In a real application, you might want to display an error message to the user
    // or log to an error tracking service.
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">
          AI Articles & Guides
        </h1>

        {articles && articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <Link href={`/articles/${article.slug}`} className="block">
                  <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                    {article.title}
                  </h2>
                </Link>
                <p className="mt-2 text-gray-700 text-sm">
                  By {article.author} on {new Date(article.publishDate).toLocaleDateString()}
                </p>
                <p className="mt-4 text-gray-600">
                  {article.contentBody.substring(0, 150)}...
                </p>
                <Link href={`/articles/${article.slug}`} className="mt-4 inline-block text-blue-600 hover:underline text-sm">
                    Read More
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
}

// This tells Next.js to re-generate this page in the background at most
// once every hour (3600 seconds). This is a good balance for content that
// doesn't change as frequently as job postings, providing performance benefits
// while keeping content reasonably fresh.
export const revalidate = 3600;
