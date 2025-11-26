import { orchestrateJobs } from '@/data-pipeline/main';
import * as jobSources from '@/data-pipeline/pipeline.config.jobs';
import { IJobSource, StandardJob } from '@/data-pipeline/types';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import path from 'path';

// Mock the dependencies that should not run in a test environment
jest.mock('@/data-pipeline/pipeline.config.jobs');
jest.mock('@/data-pipeline/utils/metrics');
jest.mock('@/data-pipeline/utils/logger');
jest.mock('@/data-pipeline/utils/dlq');

const mockedGetJobSources = jobSources.getJobSources as jest.Mock;

describe('main.ts - V2 Integration Test', () => {
  let tmpDir: string;
  let jobDescriptionsDir: string;
  let archiveDir: string;

  beforeEach(async () => {
    // Create a temporary directory for the test run
    tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'test-pipeline-'));
    jobDescriptionsDir = path.join(tmpDir, 'src', 'job-descriptions');
    archiveDir = path.join(tmpDir, 'scripts', 'archive');
    await fs.mkdir(jobDescriptionsDir, { recursive: true });
    await fs.mkdir(archiveDir, { recursive: true });

    // Mock the directory constants in main.ts
    jest.spyOn(path, 'resolve').mockImplementation((...paths) => {
      if (paths.includes('job-descriptions')) {
        return jobDescriptionsDir;
      }
      if (paths.includes('archive')) {
        return archiveDir;
      }
      return path.join(tmpDir, ...paths);
    });
  });

  afterEach(async () => {
    // Clean up the temporary directory
    await fs.rm(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('should fetch new jobs and write them to the filesystem', async () => {
    // Arrange
    const mockRemoteJobs = [
      { id: 'job-1', title: 'Software Engineer' },
      { id: 'job-2', title: 'Data Scientist' },
    ];

    const mockSource: IJobSource = {
      name: 'test-source',
      fetchJobs: jest.fn().mockResolvedValue(mockRemoteJobs),
      transform: jest.fn((job: StandardJob): StandardJob => ({
        id: job.id,
        title: job.title,
        company: 'TestCo',
        location: 'Remote',
        description: `Description for ${job.title}`,
        applicationLink: 'https://example.com',
        postedDate: new Date(),
        status: 'published',
        source: 'test-source',
      })),
    };

    mockedGetJobSources.mockResolvedValue([mockSource]);

    // Act
    await orchestrateJobs();

    // Assert
    const files = await fs.readdir(jobDescriptionsDir);
    expect(files).toHaveLength(2);
    expect(files).toContain('test-source-job-1.md');
    expect(files).toContain('test-source-job-2.md');

    const content = await fs.readFile(path.join(jobDescriptionsDir, 'test-source-job-1.md'), 'utf-8');
    expect(content).toContain('title: Software Engineer');
  });

  it('should archive stale jobs that are no longer in the remote source', async () => {
    // Arrange
    // Create a "stale" file that should be archived
    const staleJobPath = path.join(jobDescriptionsDir, 'test-source-stale-job.md');
    await fs.writeFile(staleJobPath, '---\nid: stale-job\nsource: test-source\n---\n');

    const mockRemoteJobs = [{ id: 'job-1', title: 'Software Engineer' }];

    const mockSource: IJobSource = {
      name: 'test-source',
      fetchJobs: jest.fn().mockResolvedValue(mockRemoteJobs),
      transform: jest.fn((job: StandardJob): StandardJob => ({
        id: job.id,
        title: job.title,
        company: 'TestCo',
        location: 'Remote',
        description: `Description for ${job.title}`,
        applicationLink: 'https://example.com',
        postedDate: new Date(),
        status: 'published',
        source: 'test-source',
      })),
    };

    mockedGetJobSources.mockResolvedValue([mockSource]);

    // Act
    await orchestrateJobs();

    // Assert
    const jobFiles = await fs.readdir(jobDescriptionsDir);
    expect(jobFiles).toHaveLength(1);
    expect(jobFiles).toContain('test-source-job-1.md');

    const archiveFiles = await fs.readdir(archiveDir);
    expect(archiveFiles).toHaveLength(1);
    expect(archiveFiles).toContain('test-source-stale-job.md');
  });

  it('should not write or archive any files in --dry-run mode', async () => {
    // Arrange
    process.argv.push('--dry-run');
    const staleJobPath = path.join(jobDescriptionsDir, 'test-source-stale-job.md');
    await fs.writeFile(staleJobPath, '---\nid: stale-job\nsource: test-source\n---\n');

    const mockRemoteJobs = [{ id: 'job-1', title: 'Software Engineer' }];

    const mockSource: IJobSource = {
      name: 'test-source',
      fetchJobs: jest.fn().mockResolvedValue(mockRemoteJobs),
      transform: jest.fn((job: StandardJob): StandardJob => ({
        id: job.id,
        title: job.title,
        company: 'TestCo',
        location: 'Remote',
        description: `Description for ${job.title}`,
        applicationLink: 'https://example.com',
        postedDate: new Date(),
        status: 'published',
        source: 'test-source',
      })),
    };

    mockedGetJobSources.mockResolvedValue([mockSource]);

    // Act
    await orchestrateJobs();

    // Assert
    const jobFiles = await fs.readdir(jobDescriptionsDir);
    expect(jobFiles).toHaveLength(1); // The stale file should still be there
    expect(jobFiles).toContain('test-source-stale-job.md');

    const archiveFiles = await fs.readdir(archiveDir);
    expect(archiveFiles).toHaveLength(0); // Nothing should be archived

    process.argv.pop(); // Clean up the --dry-run arg
  });
});