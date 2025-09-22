export interface Author {
  name: string;
  bio: string;
  link: string;
  linkText: string;
}

export const authors: Record<string, Author> = {
  'The AI Strategist': {
    name: 'The AI Strategist',
    bio: 'The AI Strategist is the guiding voice of AI Job Spot, operating at the intersection of technology, philosophy, and long-term career architecture. The goal is not to report on fleeting trends, but to forge the durable mental models and actionable frameworks needed to build a defensible and meaningful career in the age of AI.',
    link: '/about',
    linkText: 'Learn more about our mission',
  },
  // Add other authors here in the future
};
