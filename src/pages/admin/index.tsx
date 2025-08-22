import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout title="Admin Dashboard">
      <h1 className="text-4xl font-serif font-bold text-primary-dark mb-4">Admin Dashboard</h1>
      <p className="text-lg text-neutral-700 mb-10">Welcome to the AI Job Spot admin panel. From here, you can manage all content on the site.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card for Managing Jobs */}
        <div className="bg-neutral-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-neutral-200">
          <h2 className="text-2xl font-serif font-semibold text-primary-dark mb-4">Manage Job Postings</h2>
          <p className="text-neutral-600 mb-6">Create, edit, and delete job listings. You can also review and publish submissions from employers.</p>
          <Link href="/admin/jobs" passHref>
            <span className="inline-block bg-secondary text-white py-2 px-6 rounded-md font-semibold hover:bg-secondary-dark transition-colors cursor-pointer">
              Go to Jobs
            </span>
          </Link>
        </div>

        {/* Card for Managing Articles */}
        <div className="bg-neutral-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-neutral-200">
          <h2 className="text-2xl font-serif font-semibold text-primary-dark mb-4">Manage Articles</h2>
          <p className="text-neutral-600 mb-6">Write new articles, edit existing content, and manage the publication status of all written works.</p>
          <Link href="/admin/articles" passHref>
            <span className="inline-block bg-secondary text-white py-2 px-6 rounded-md font-semibold hover:bg-secondary-dark transition-colors cursor-pointer">
              Go to Articles
            </span>
          </Link>
        </div>

        {/* Card for Pending Reviews */}
        <div className="bg-neutral-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-neutral-200 md:col-span-2">
          <h2 className="text-2xl font-serif font-semibold text-primary-dark mb-4">Pending Reviews</h2>
          <p className="text-neutral-600 mb-6">Review job postings submitted by external employers before they go live on the site. Approve or reject submissions here.</p>
          <Link href="/admin/reviews" passHref>
            <span className="inline-block bg-accent text-white py-2 px-6 rounded-md font-semibold hover:bg-accent-dark transition-colors cursor-pointer">
              View Pending Jobs
            </span>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
