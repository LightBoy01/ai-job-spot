import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

interface DashboardStats {
  totalPublishedJobs: number;
  totalPendingReviews: number;
  totalRejectedJobs: number;
  weeklySubmissions: number;
  approvalRate: string;
  rejectionRate: string;
}

interface AdminDashboardProps {
  stats: DashboardStats;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats }) => {
  return (
    <AdminLayout title="Admin Dashboard">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary-dark">
            Dashboard
          </h1>
          <p className="text-lg text-neutral-600 mt-1">
            Welcome back, Admin. Here is a snapshot of your site.
          </p>
        </div>
        <div className="flex space-x-4">
          <Link href="/admin/jobs/new" passHref>
            <span className="bg-primary hover:bg-primary-dark text-white py-2 px-5 rounded-lg font-semibold transition-colors cursor-pointer shadow-sm">
              + Add New Job
            </span>
          </Link>
          <Link href="/admin/articles/new" passHref>
            <span className="bg-secondary hover:bg-secondary-dark text-white py-2 px-5 rounded-lg font-semibold transition-colors cursor-pointer shadow-sm">
              + Add New Article
            </span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
          <h3 className="text-lg font-semibold text-neutral-500">
            Published Jobs
          </h3>
          <p className="text-5xl font-serif font-bold text-primary-dark mt-2">
            {stats.totalPublishedJobs}
          </p>
          <Link href="/admin/jobs" passHref>
            <span className="text-sm font-semibold text-secondary-dark hover:text-secondary mt-4 inline-block">
              Manage Jobs &rarr;
            </span>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5 ring-2 ring-accent/50">
          <h3 className="text-lg font-semibold text-neutral-500">
            Pending Reviews
          </h3>
          <p className="text-5xl font-serif font-bold text-accent-dark mt-2">
            {stats.totalPendingReviews}
          </p>
          <Link href="/admin/reviews" passHref>
            <span className="text-sm font-semibold text-accent-dark hover:text-accent mt-4 inline-block">
              View Queue &rarr;
            </span>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
          <h3 className="text-lg font-semibold text-neutral-500">
            Weekly Submissions
          </h3>
          <p className="text-5xl font-serif font-bold text-primary-dark mt-2">
            {stats.weeklySubmissions}
          </p>
          <p className="text-sm text-neutral-500 mt-2">Last 7 days</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
          <h3 className="text-lg font-semibold text-neutral-500">
            Approval Rate
          </h3>
          <p className="text-5xl font-serif font-bold text-green-600 mt-2">
            {stats.approvalRate}%
          </p>
          <p className="text-sm text-neutral-500 mt-2">of reviewed jobs</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
          <h3 className="text-lg font-semibold text-neutral-500">
            Rejection Rate
          </h3>
          <p className="text-5xl font-serif font-bold text-red-600 mt-2">
            {stats.rejectionRate}%
          </p>
          <p className="text-sm text-neutral-500 mt-2">of reviewed jobs</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<AdminDashboardProps> = async ({ req }) => {
  try {
    const { adminDb, adminAuth } = await getFirebaseAdmin();
    const sessionCookie = req.cookies.__session || '';
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (!decodedToken.admin) {
      throw new Error('User is not an admin');
    }

    const jobsCollection = adminDb.collection('jobs');
    const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const publishedSnapshot = await jobsCollection.where('status', '==', 'published').get();
    const pendingSnapshot = await jobsCollection.where('status', '==', 'pending_review').get();
    const rejectedSnapshot = await jobsCollection.where('status', '==', 'rejected').get();
    const weeklySnapshot = await jobsCollection.where('postedDate', '>=', sevenDaysAgo).get();

    const totalPublishedJobs = publishedSnapshot.size;
    const totalPendingReviews = pendingSnapshot.size;
    const totalRejectedJobs = rejectedSnapshot.size;
    const weeklySubmissions = weeklySnapshot.size;

    const totalReviewed = totalPublishedJobs + totalRejectedJobs;
    const approvalRate = totalReviewed > 0 ? ((totalPublishedJobs / totalReviewed) * 100).toFixed(2) : '0.00';
    const rejectionRate = totalReviewed > 0 ? ((totalRejectedJobs / totalReviewed) * 100).toFixed(2) : '0.00';

    return {
      props: {
        stats: {
          totalPublishedJobs,
          totalPendingReviews,
          totalRejectedJobs,
          weeklySubmissions,
          approvalRate,
          rejectionRate,
        },
      },
    };
  } catch (error) {
    console.error('GSSP Auth Error or DB Error on Admin Dashboard:', error);
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }
};

export default AdminDashboard;

