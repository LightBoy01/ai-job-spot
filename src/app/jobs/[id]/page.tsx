import Layout from '@/components/Layout';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobPosting } from '@/lib/types';
import { notFound } from 'next/navigation';

// Define the props type for the page, reflecting Next.js 15+ changes
type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function JobDetailsPage({ params }: Props) {
  const { id } = await params;
  let job: JobPosting | null = null;

  try {
    const docRef = doc(db, 'jobs', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      job = {
        id: docSnap.id,
        ...(docSnap.data() as JobPosting),
        // Ensure postedDate is converted correctly
        postedDate: docSnap.data().postedDate?.toDate ? docSnap.data().postedDate.toDate() : new Date(docSnap.data().postedDate),
      };
    } else {
      notFound();
    }
  } catch (error) {
    console.error("Error fetching job details:", error);
    notFound();
  }

  if (!job) {
    notFound();
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
        <p className="text-xl text-gray-700">{job.company}</p>
        <p className="text-gray-600">{job.location}</p>
        {job.salaryRange && (
          <p className="text-gray-600">Salary: {job.salaryRange}</p>
        )}
        <div className="prose" dangerouslySetInnerHTML={{ __html: job.description }} />
        <p className="text-sm text-gray-500">
          Posted: {new Date(job.postedDate).toLocaleDateString()}
        </p>
        <a
          href={job.applicationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply Now
        </a>
      </div>
    </Layout>
  );
}

export const revalidate = 60;
