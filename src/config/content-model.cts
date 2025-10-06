type ContentOperation = 'hygiene' | 'enrichment' | 'seeding';

interface ContentTypeConfig {
  path: string;
  idField: 'id' | 'slug';
  operations: ContentOperation[];
}

const CONTENT_MODEL: Record<string, ContentTypeConfig> = {
  jobs: {
    path: 'src/job-descriptions',
    idField: 'id',
    operations: ['hygiene', 'enrichment', 'seeding'],
  },
  articles: {
    path: 'src/articles',
    idField: 'slug',
    operations: ['seeding'],
  },
  briefings: {
    path: 'src/content/briefings',
    idField: 'id',
    operations: ['hygiene', 'enrichment', 'seeding'],
  },
};

module.exports = { CONTENT_MODEL };