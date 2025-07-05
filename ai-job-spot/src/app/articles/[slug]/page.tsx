import Layout from '@/components/Layout';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Metadata } from 'next';

interface Article {
  id: string;
  slug: string;
  title: string;
  author: string;
  publishDate: string;
  content: string;
  imageUrl?: string;
}

interface ArticleDetailsPageProps {
  params: {
    slug: string;
  };
}

// Generate dynamic metadata for each article
export async function generateMetadata({ params }: ArticleDetailsPageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: "Article Not Found - AI Job Spot",
      description: "The article you are looking for does not exist.",
    };
  }

  return {
    title: `${article.title} by ${article.author} - AI Job Spot`,
    description: article.content.substring(0, 160) + '...', // Truncate for meta description
    openGraph: {
      title: `${article.title} by ${article.author}`,
      description: article.content.substring(0, 160) + '...',
      type: 'article',
      url: `https://aijobspot.com/articles/${article.slug}`, // Replace with your actual domain
      images: article.imageUrl ? [{ url: article.imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} by ${article.author}`,
      description: article.content.substring(0, 160) + '...',
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

// Function to fetch article data by slug
async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const articlesCollectionRef = db.collection('articles');
    const q = articlesCollectionRef.where('slug', '==', slug).limit(1);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      slug: doc.data().slug || doc.id,
      title: doc.data().title,
      author: doc.data().author,
      publishDate: doc.data().publishDate?.toDate().toISOString() || new Date().toISOString(),
      content: doc.data().content,
      imageUrl: doc.data().imageUrl || undefined,
    };
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    return null;
  }
}

export default async function ArticleDetailsPage({ params }: ArticleDetailsPageProps) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h1 className="text-3xl font-bold text-gray-800">Article Not Found</h1>
          <p className="mt-4 text-gray-600">The article you are looking for does not exist or has been removed.</p>
          <a href="/articles" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Back to Articles
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
        <p className="mt-2 text-md text-gray-700">By {article.author} on {new Date(article.publishDate).toLocaleDateString()}</p>
        {article.imageUrl && (
          <div className="my-4">
            <img src={article.imageUrl} alt={article.title} className="w-full h-auto rounded-lg" />
          </div>
        )}
        <div className="mt-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
    </Layout>
  );
}

export const revalidate = 60;
