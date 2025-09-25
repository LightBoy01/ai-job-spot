import Link from 'next/link';
import { SerializedJobPosting, SerializedArticleSummary } from '@/lib/types';

interface SidebarProps {
  title: string;
  items: (SerializedJobPosting | SerializedArticleSummary)[];
}

const Sidebar = ({ title, items }: SidebarProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <aside className="sticky top-24 bg-neutral-50 border border-neutral-200 rounded-lg p-6">
      <h3 className="text-xl font-serif font-semibold text-primary-dark mb-4">
        {title}
      </h3>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id}>
            {'slug' in item ? (
              <Link
                href={`/articles/${item.slug}`}
                className="text-primary hover:text-primary-dark transition-colors"
              >
                {item.title}
              </Link>
            ) : (
              <Link
                href={`/jobs/${item.id}`}
                className="text-primary hover:text-primary-dark transition-colors"
              >
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
