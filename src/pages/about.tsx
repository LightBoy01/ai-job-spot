import Layout from '@/components/Layout';
import Head from 'next/head';
import Logo from '@/components/Logo';

const About: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>About AI Job Spot | Our Mission & Manifesto</title>
        <meta name="description" content="AI Job Spot is a career resource for ambitious professionals. We don't just list jobs; we build the durable mental models and actionable frameworks needed for success in the age of AI." />
        <meta property="og:title" content="About AI Job Spot | Our Mission & Manifesto" />
        <meta property="og:description" content="Learn how we're building a community dedicated to providing a true strategic advantage for your career in the artificial intelligence landscape." />
      </Head>
      <div className="bg-neutral-50 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          <h1 className="page-title">
            Your Career is an Asset. We Build Your Moat.
          </h1>
          <p className="mt-6 text-xl text-neutral-700 leading-8">
            In an age where skills can be automated, the most valuable professional is the one with a defensible strategy. AI Job Spot was founded to provide ambitious professionals with a distinct, durable, and strategic edge.
          </p>
        </div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 mt-16 text-left">
          <div className="prose prose-lg max-w-none font-sans text-neutral-800 leading-relaxed article-content">
            <h2>Our Mission: From Information to Advantage</h2>
            <p>Most job boards are marketplaces of information. They provide the &quot;what&quot;—the listings, the qualifications, the keywords. This is useful, but it is no longer enough. Information has become a commodity.</p>
            <p>Our mission is to provide something more valuable: **advantage**. We do this by focusing on the &quot;how&quot;—how to think, how to strategize, and how to build a career that is resilient to technological change. We serve the intellectually curious professional who seeks not just their next job, but a defensible, long-term career architecture.</p>

            <h2>The AI Strategist: Our Guiding Voice</h2>
            <p>The articles and insights on this platform are crafted by &quot;The AI Strategist.&quot; This is the embodiment of our core philosophy: that true career advantage is born from the synthesis of timeless wisdom and actionable strategy.</p>
            <p>The voice of The AI Strategist is built on a dual foundation:</p>
            <ul>
              <li><strong>Grounded in Wisdom:</strong> Our insights are rooted in a deep, philosophical understanding of history, human nature, and enduring principles. We look to the timeless to make sense of the timely.</li>
              <li><strong>Forged into Frameworks:</strong> This wisdom is then forged into sharp, actionable mental models. We don&apos;t just offer ideas; we deliver proprietary frameworks like &quot;The Anti-Portfolio&quot; and &quot;The Oracle Mindset&quot; that you can use to immediately think differently and make better decisions.</li>
            </ul>
            <p>This approach ensures our content respects your time and intelligence, offering you a toolkit of mental models to build your professional moat.</p>

            <h2>Why We Do This</h2>
            <p>We are at a pivotal moment in history. The rise of AI is not just a technological shift; it is a strategic one. It changes the rules of professional value creation.</p>
            <p>We created AI Job Spot to be the definitive resource for those who intend to win in this new era. The future belongs not to those who compete with machines, but to those who can out-think the competition with superior strategy. Our goal is to provide the insights, the frameworks, and the opportunities to help you do just that.</p>
            <p>Thank you for being part of our community.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;