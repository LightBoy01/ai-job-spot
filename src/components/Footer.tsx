import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-dark text-neutral-100 py-12 mt-16 border-t border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
          {/* Section 1: About */}
          <div>
            <h3 className="text-xl font-serif font-semibold text-secondary-light mb-4">
              AI Job Spot
            </h3>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Your premier destination for AI career opportunities and insights.
              We connect talent with the future of artificial intelligence.
            </p>
          </div>

          {/* Section 2: Quick Links */}
          <div>
            <h3 className="text-xl font-serif font-semibold text-secondary-light mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-neutral-300 hover:text-secondary transition-colors">
                  AI Jobs
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-neutral-300 hover:text-secondary transition-colors">
                  Articles & Insights
                </Link>
              </li>
              <li>
                <Link href="/tags" className="text-neutral-300 hover:text-secondary transition-colors">
                  Thematic Hubs
                </Link>
              </li>
              <li>
                <Link href="/post-a-job" className="text-neutral-300 hover:text-secondary transition-colors">
                  Post a Job
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3: Legal & Contact */}
          <div>
            <h3 className="text-xl font-serif font-semibold text-secondary-light mb-4">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-neutral-300 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-300 hover:text-secondary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-neutral-300 hover:text-secondary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-neutral-300 hover:text-secondary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 4: Connect */}
          <div>
            <h3 className="text-xl font-serif font-semibold text-secondary-light mb-4">
              Connect
            </h3>
            <div className="flex justify-center md:justify-start space-x-6">
              <a href="#" className="text-neutral-300 hover:text-secondary transition-colors">
                <span className="sr-only">Twitter</span>
                <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26L21.61 21.75h-5.25l-4.55-6.27L8.25 21.75H2.924l7.393-8.426L2.25 2.25h5.084l3.988 5.483L18.244 2.25zm-4.77 15.315l3.493 4.43H14.5L8.106 6.288H5.99l8.234 11.277z" />
                </svg>
              </a>
              <a href="#" className="text-neutral-300 hover:text-secondary transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-12 pt-8 text-center text-neutral-500 text-sm">
          &copy; {currentYear} AI Job Spot. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
