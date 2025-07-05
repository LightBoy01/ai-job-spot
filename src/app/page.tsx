import Layout from '../components/Layout';
import JobCard from '../components/JobCard';
import { db } from '../lib/firebase'; // Import the Firestore instance
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

/**
 * The home page of the application.
 * It displays a list of the latest job postings fetched from Firestore at build time.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.jobs - The array of job objects fetched from Firestore.
 * @returns {JSX.Element} The rendered HomePage component.
 */
const HomePage = ({ jobs }) => {
  return (
    // Pass page-specific title and description to the Layout for optimal SEO.
    <Layout
      title="Latest AI Jobs | AI Job Spot"
      description="Browse hundreds of the latest AI, Machine Learning, and Data Science jobs from top companies around the world."
    >
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Latest AI Jobs
        </h1>

        {/* Check if there are jobs to display, otherwise show a message. */}
        {jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No jobs posted yet. Check back soon!</p>
        )}
      </div>
    </Layout>
  );
};

// This function runs at build time on the server.
// It's the core of our SEO and performance strategy for this page.
export async function getStaticProps() {
  
  // 1. Create a reference to the 'jobs' collection in Firestore, ordered by creation date.
  const jobsCollectionRef = collection(db, 'jobs');
  const q = query(jobsCollectionRef, orderBy('createdAt', 'desc'));

  // 2. Fetch the documents from the collection.
  const querySnapshot = await getDocs(q);

  // 3. Map over the documents, extracting the data and adding the document ID.
  // The data must be serialized (plain objects), so we can't pass Firestore doc snapshots directly.
  const jobs = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Ensure createdAt is a serializable string if it's a Timestamp object
    createdAt: doc.data().createdAt.toDate().toISOString(),
  }));

  // 4. Return the fetched data as props to the HomePage component.
  return {
    props: {
      jobs,
    },
    // This is Incremental Static Regeneration (ISR).
    // It tells Next.js to re-generate this page in the background at most
    // once every 60 seconds. This keeps the job list fresh without
    // sacrificing the speed of a static site. It's the perfect balance
    // for SEO (bots see a fully rendered page) and performance (users get a
    // fast, cached page).
    revalidate: 60, 
  };
}

export default HomePage;
