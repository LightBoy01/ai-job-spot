import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

const AdminDashboard: React.FC = () => {
  // Placeholder data - in a real app, this would be fetched from the backend.
  const stats = {
    publishedJobs: 78,
    pendingReviews: 3,
    publishedArticles: 30,
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Published Jobs Stat Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
          <h3 className="text-lg font-semibold text-neutral-500">
            Published Jobs
          </h3>
          <p className="text-5xl font-serif font-bold text-primary-dark mt-2">
            {stats.publishedJobs}
          </p>
          <Link href="/admin/jobs" passHref>
            <span className="text-sm font-semibold text-secondary-dark hover:text-secondary mt-4 inline-block">
              Manage Jobs &rarr;
            </span>
          </Link>
        </div>

        {/* Pending Reviews Stat Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5 ring-2 ring-accent/50">
          <h3 className="text-lg font-semibold text-neutral-500">
            Pending Reviews
          </h3>
          <p className="text-5xl font-serif font-bold text-accent-dark mt-2">
            {stats.pendingReviews}
          </p>
          <Link href="/admin/reviews" passHref>
            <span className="text-sm font-semibold text-accent-dark hover:text-accent mt-4 inline-block">
              View Queue &rarr;
            </span>
          </Link>
        </div>

        {/* Published Articles Stat Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
          <h3 className="text-lg font-semibold text-neutral-500">
            Published Articles
          </h3>
          <p className="text-5xl font-serif font-bold text-primary-dark mt-2">
            {stats.publishedArticles}
          </p>
          <Link href="/admin/articles" passHref>
            <span className="text-sm font-semibold text-secondary-dark hover:text-secondary mt-4 inline-block">
              Manage Articles &rarr;
            </span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
