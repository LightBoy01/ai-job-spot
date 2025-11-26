import fs from 'fs/promises';
import matter from 'gray-matter';
import { processDirectory } from '../../seedFirestore.ts'; // Import the function to test

// --- Centralized Mocks ---
jest.mock('fs/promises');
jest.mock('gray-matter');
jest.mock('util');
jest.mock('@/lib/firebaseAdmin.ts', () => ({
  __esModule: true,
  adminDb: {},
  admin: {
    firestore: {
      Timestamp: {
        fromDate: (date: Date) => ({ toDate: () => date, _isMock: true }), // Mock timestamp
      },
    },
  },
}));
jest.mock('../../scripts/indexing_api_client.ts');
jest.mock('child_process');

// Mock the marked library
jest.mock('marked', () => ({
    marked: jest.fn(content => Promise.resolve(content)),
}));

// --- Typed Mocks ---
const mockFs = fs as jest.Mocked<typeof fs>;
const mockMatter = matter as jest.Mock;

describe('seedFirestore.ts - processDirectory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly process a directory of valid job markdown files', async () => {
    // --- Arrange (Setup) ---
    const mockJobData = {
      id: 'test-job-1',
      title: 'Senior AI Engineer',
      company: 'FutureTech',
      location: 'Remote',
      applicationLink: 'https://example.com/apply',
      postedDate: '2025-09-24',
      status: 'published',
    };

    const mockFileContent = '---\n...frontmatter...\n---\nThis is the job description.\n\n### Responsibilities\n- Develop AI models.\n\n### Qualifications\n- PhD in AI.';

    // Mock the file system to return one job file
    mockFs.readdir.mockResolvedValue(['test-job-1.md']);
    mockFs.readFile.mockResolvedValue(mockFileContent);
    mockFs.stat.mockResolvedValue({ size: 500 }); // Add this mock

    // Mock gray-matter to parse the frontmatter and content
    mockMatter.mockReturnValue({
      data: mockJobData,
      content: mockFileContent.split('---\n')[2], // Get content part
    });

    // --- Act (Execution) ---
    const result = await processDirectory('/fake/jobs/dir', 'jobs');

    // --- Assert (Verification) ---
    expect(result).toHaveLength(1);
    const processedJob = result[0];

    // Check if frontmatter data is preserved
    expect(processedJob.id).toBe('test-job-1');
    expect(processedJob.title).toBe('Senior AI Engineer');

    // Check if date is converted to our mock timestamp
    expect(processedJob.postedDate).toHaveProperty('_isMock', true);

    // Check if content was parsed correctly
    expect(processedJob.description).toBe('This is the job description.');
    expect(processedJob.responsibilities).toEqual(['Develop AI models.']);
    expect(processedJob.qualifications).toEqual(['PhD in AI.']);

    // Check if excerpt was generated
    expect(processedJob.excerpt).toBeDefined();
    expect(processedJob.excerpt.length).toBeLessThanOrEqual(160);
  });

  it('should correctly process a directory of valid article markdown files', async () => {
    // --- Arrange (Setup) ---
    const mockArticleData = {
        slug: 'test-article',
        title: 'Test Article',
        author: 'Jane Doe',
        publishDate: '2025-09-24',
        issueNo: 1,
        volumeNo: 1,
        contentType: 'editorial', // Add missing field
    };

    const mockFileContent = '---\n...frontmatter...\n---\nThis is the article body.';

    mockFs.stat.mockResolvedValue({ size: 500 }); // Add this mock

    mockMatter.mockReturnValue({
        data: mockArticleData,
        content: 'This is the article body.',
    });

    // --- Act (Execution) ---
    const result = await processDirectory('/fake/articles/dir', 'articles');

    // --- Assert (Verification) ---
    expect(result).toHaveLength(1);
    const processedArticle = result[0];

    expect(processedArticle.slug).toBe('test-article');
    expect(processedArticle.title).toBe('Test Article');
    expect(processedArticle.publishDate).toHaveProperty('_isMock', true);
    expect(processedArticle.contentBody).toBe('This is the article body.');
    expect(processedArticle.excerpt).toBeDefined();
  });

  it('should skip a file if Zod validation fails', async () => {
    // --- Arrange ---
    const invalidJobData = { id: 'bad-job', title: 'Incomplete Job' }; // Missing required fields

    mockFs.readdir.mockResolvedValue(['bad-job.md']);
    mockFs.readFile.mockResolvedValue('content');
    mockMatter.mockReturnValue({ data: invalidJobData, content: 'content' });

    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // --- Act ---
    const result = await processDirectory('/fake/jobs/dir', 'jobs');

    // --- Assert ---
    expect(result).toHaveLength(0); // The invalid file should be skipped
    expect(consoleErrorSpy).toHaveBeenCalled(); // Ensure the failure was logged

    consoleErrorSpy.mockRestore();
  });

  it('should correctly parse contentType from article frontmatter', async () => {
    // --- Arrange ---
    const mockArticleData = {
        slug: 'content-type-article',
        title: 'Article with Content Type',
        author: 'Tester',
        publishDate: '2025-10-02',
        issueNo: 1,
        volumeNo: 1,
        contentType: 'editorial', // The field we are testing
    };

    const mockFileContent = '---\n...frontmatter...\n---\nArticle body.';

    mockFs.readdir.mockResolvedValue(['content-type-article.md']);
    mockFs.readFile.mockResolvedValue(mockFileContent);
    mockFs.stat.mockResolvedValue({ size: 500 }); // Add this mock
    mockMatter.mockReturnValue({
        data: mockArticleData,
        content: 'Article body.',
    });

    // --- Act ---
    const result = await processDirectory('/fake/articles/dir', 'articles');

    // --- Assert ---
    expect(result).toHaveLength(1);
    const processedArticle = result[0];
    expect(processedArticle.slug).toBe('content-type-article');
    expect(processedArticle.contentType).toBe('editorial'); // Verify the new field is parsed
  });
});
