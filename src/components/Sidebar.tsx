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
      <ul className="-mx-6 -mb-6">
        {items.map((item) => (
          <li key={item.id} className="border-b border-neutral-200/80 last:border-b-0">
            {'slug' in item ? (
              <Link
                href={`/articles/${item.slug}`}
                className="block px-6 py-4 font-medium text-neutral-700 hover:bg-primary/5 hover:text-primary-dark transition-colors duration-200"
              >
                {item.title}
              </Link>
            ) : (
              <Link
                href={`/jobs/${item.id}`}
                className="block px-6 py-4 font-medium text-neutral-700 hover:bg-primary/5 hover:text-primary-dark transition-colors duration-200"
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
