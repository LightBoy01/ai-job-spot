import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-dark text-neutral-100 py-12 mt-16 border-t border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Section 1: About */}
          <div>
            <h3 className="text-xl font-serif font-semibold text-secondary-light mb-4">AI Job Spot</h3>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Your premier destination for AI career opportunities and insights. We connect talent with the future of artificial intelligence.
            </p>
          </div>

          {/* Section 2: Quick Links */}
          <div>
            <h3 className="text-xl font-serif font-semibold text-secondary-light mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-neutral-300 hover:text-secondary transition-colors">AI Jobs</Link></li>
              <li><Link href="/articles" className="text-neutral-300 hover:text-secondary transition-colors">Articles & Insights</Link></li>
              <li><Link href="/post-a-job" className="text-neutral-300 hover:text-secondary transition-colors">Post a Job</Link></li>
            </ul>
          </div>

          {/* Section 3: Legal & Contact */}
          <div>
            <h3 className="text-xl font-serif font-semibold text-secondary-light mb-4">Legal & Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-neutral-300 hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-neutral-300 hover:text-secondary transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-neutral-300 hover:text-secondary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-neutral-300 hover:text-secondary transition-colors">Terms of Service</Link></li>
            </ul>
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
