import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { TOOLS, ToolMetadata } from '@/lib/tools';
import Icon from '@/components/Icon';
import AdContainer from '@/components/AdContainer';

interface ToolsIndexPageProps {
  tools: ToolMetadata[];
}

const ToolsIndexPage: NextPage<ToolsIndexPageProps> = ({ tools }) => {
  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolMetadata[]>);

  const categories = Object.keys(toolsByCategory).sort();

  return (
    <Layout>
      <Head>
        <title>AI Tools & Resources | AI Job Spot</title>
        <meta
          name="description"
          content="Explore essential AI tools, frameworks, and resources. Find jobs by tool expertise and simulate your AI career path."
        />
      </Head>

      <div className="bg-gradient-to-b from-primary/5 to-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary-dark mb-6">
            AI Tools & Resources
          </h1>
          <p className="text-xl text-neutral-600 font-light max-w-3xl mx-auto leading-relaxed">
            Master the stack that defines the future. Explore jobs by specific AI technologies or plan your career trajectory.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Feature: Career Simulator */}
        <div className="mb-20">
          <div className="bg-primary-dark rounded-2xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden group">
             {/* Decorative background elements */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl group-hover:bg-secondary/30 transition-colors duration-500"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium mb-4 border border-white/20">
                   <Icon name="sparkles" className="w-4 h-4 text-secondary" />
                   <span>Interactive Tool</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                  AI Career Simulator
                </h2>
                <p className="text-primary-light text-lg mb-0 max-w-xl">
                  Unsure where to go next? Visualize your potential career path in the AI industry based on real market data.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/tools/career-simulator"
                  className="inline-flex items-center bg-white text-primary-dark font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl hover:bg-neutral-50 transition-all transform hover:-translate-y-1"
                >
                  Launch Simulator
                  <Icon name="arrow-right" className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Directory */}
        <div>
           <h2 className="text-3xl font-serif font-bold text-primary-dark mb-10 border-b border-neutral-200 pb-4">
            Browse Jobs by Technology
          </h2>
          
          <div className="space-y-16">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xl font-bold text-secondary-dark mb-6 flex items-center uppercase tracking-wider text-sm">
                  <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {toolsByCategory[category].map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="group block bg-white border border-neutral-200 rounded-xl p-6 hover:border-secondary/40 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-neutral-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                           <Icon name="code" className="w-6 h-6 text-neutral-600 group-hover:text-primary" />
                        </div>
                        <Icon name="arrow-right" className="w-5 h-5 text-neutral-300 group-hover:text-secondary transition-colors transform group-hover:translate-x-1" />
                      </div>
                      <h4 className="text-xl font-serif font-bold text-primary-dark group-hover:text-primary transition-colors mb-2">
                        {tool.name}
                      </h4>
                      <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center text-xs font-medium text-neutral-400 group-hover:text-secondary-dark transition-colors">
                        View Jobs & Resources
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="my-16">
          <AdContainer
            slot={process.env.NEXT_PUBLIC_ADSENSE_TAG_PAGE_SLOT || ''}
          />
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<ToolsIndexPageProps> = async () => {
  return {
    props: {
      tools: TOOLS,
    },
  };
};

export default ToolsIndexPage;
