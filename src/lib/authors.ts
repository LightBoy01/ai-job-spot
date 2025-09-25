export interface Author {
  name: string;
  title: string;
  bio: string;
  link: string;
  linkText: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    // Add other social links as needed
  };
}

export const authors: Record<string, Author> = {
  'The AI Strategist': {
    name: 'The AI Strategist',
    title: 'Lead Futurist & Career Architect',
    bio: 'The AI Strategist is the guiding voice of AI Job Spot, operating at the intersection of technology, philosophy, and long-term career architecture. The goal is not to report on fleeting trends, but to forge the durable mental models and actionable frameworks needed to build a defensible and meaningful career in the age of AI.',
    link: '/about',
    linkText: 'Learn more about our mission',
    socialLinks: {
      twitter: 'https://twitter.com/AIJobSpot',
      linkedin: 'https://www.linkedin.com/company/ai-job-spot/',
    },
  },
  // Add other authors here in the future
};
