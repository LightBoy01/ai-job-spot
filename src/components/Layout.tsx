import Navbar from './Navbar';
import AdContainer from './AdContainer';
import PropTypes from 'prop-types';
import Head from 'next/head'; // Import the Head component

/**
 * The main layout component for the entire site.
 * It includes the Navbar, a responsive two-column structure, and
 * handles dynamic SEO metadata (<title>, <meta description>, etc.).
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The main content to be rendered.
 * @param {string} [props.title] - The title for the page, used in the <title> tag.
 * @param {string} [props.description] - The meta description for SEO.
 * @returns {JSX.Element} The rendered Layout component.
 */
const Layout = ({ children, title, description }) => {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Head>
        {/* The title tag is crucial for SEO. It should be unique for every page. */}
        <title>{title}</title>
        {/* The meta description is used by search engines for the page snippet. */}
        <meta name="description" content={description} />
        {/* Add a favicon for branding */}
        <link rel="icon" href="/favicon.ico" />
        {/* Add other meta tags like Open Graph for social sharing here if needed */}
      </Head>

      {/* The Navbar is rendered at the top of every page */}
      <Navbar />

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
          
          {/* Primary Content Column (approx. 70%) */}
          <div className="lg:col-span-8">
            {children}
          </div>

          {/* Sidebar Column (approx. 30%) */}
          <aside className="lg:col-span-4 mt-8 lg:mt-0">
            {/* The sticky container ensures the ad stays visible on scroll */}
            <div className="sticky top-24"> 
              <AdContainer slot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT} />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

// Define PropTypes for the new props
Layout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
};

// Set default props as a fallback
Layout.defaultProps = {
  title: 'AI Job Spot - The Future of AI Careers',
  description: 'Find the latest jobs in Artificial Intelligence, Machine Learning, and Data Science.',
};

export default Layout;
