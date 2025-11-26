
import { promises as fs } from 'fs';
import {
  saveSourcesToCache,
  loadSourcesFromCache,
  CachedSourceData,
} from '@/data-pipeline/utils/source-cache';
import { Source, SourceType } from '@/lib/types';

jest.mock('@/lib/types', () => ({
  SourceType: {
    RSS: 'rss',
    API: 'api',
    // Add other SourceType values if needed for other tests
  },
}));
import logger from '@/data-pipeline/utils/logger';

// Mock the logger to prevent console output during tests
jest.mock('@/data-pipeline/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock the fs/promises module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

const mockSources: Source[] = [
  {
    id: '1',
    name: 'Test Source 1',
    url: 'http://test1.com',
    type: SourceType.RSS,
    lastCrawledAt: null,
  },
  {
    id: '2',
    name: 'Test Source 2',
    url: 'http://test2.com',
    type: SourceType.API,
    lastCrawledAt: null,
  },
];

describe('Source Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Consistent time mocking for all tests
    jest.spyOn(Date, 'now').mockReturnValue(1678886400000); // March 15, 2023 00:00:00 GMT
  });

  describe('saveSourcesToCache', () => {
    it('should create the cache directory if it does not exist', async () => {
      await saveSourcesToCache(mockSources);
      expect(mockFs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should write the sources to the cache file with a timestamp', async () => {
      const now = Date.now();
      // Date.now() is already mocked in beforeEach, so we don't need to spy again here
      await saveSourcesToCache(mockSources);

      const expectedData: CachedSourceData = {
        timestamp: now,
        sources: mockSources,
      };

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(expectedData, null, 2),
        'utf-8'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('[Cache] Successfully saved source configurations to local cache.');
    });

    it('should log a warning if saving to cache fails', async () => {
      const error = new Error('Failed to write file');
      mockFs.writeFile.mockRejectedValue(error);

      await saveSourcesToCache(mockSources);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: error },
        '[Cache] Failed to save source configurations to cache.'
      );
    });
  });

  describe('loadSourcesFromCache', () => {
    it('should return null if the cache file does not exist', async () => {
      const error = new Error('File not found') as Error & { code: string };
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await loadSourcesFromCache();

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('[Cache] No local source cache found. Fetching from Firestore.');
    });

    it('should return null if the cache is stale', async () => {
      const now = Date.now();
      const staleTimestamp = now - (25 * 60 * 60 * 1000); // 25 hours ago
      const cachedData: CachedSourceData = {
        timestamp: staleTimestamp,
        sources: mockSources,
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(cachedData));
      // Date.now() is already mocked in beforeEach, so we don't need to spy again here

      const result = await loadSourcesFromCache();

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('[Cache] Local source cache is stale. Fetching from Firestore.');
    });

    it('should return the cached sources if the cache is valid', async () => {
      const now = Date.now();
      const validTimestamp = now - (1 * 60 * 60 * 1000); // 1 hour ago
      const cachedData: CachedSourceData = {
        timestamp: validTimestamp,
        sources: mockSources,
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(cachedData));
      // Date.now() is already mocked in beforeEach, so we don't need to spy again here

      const result = await loadSourcesFromCache();

      expect(result).toEqual(mockSources);
      expect(mockLogger.info).toHaveBeenCalledWith('[Cache] Successfully loaded source configurations from local cache.');
    });

    it('should log a warning if loading from cache fails for an unknown reason', async () => {
        const error = new Error('Failed to read file');
        mockFs.readFile.mockRejectedValue(error);
  
        const result = await loadSourcesFromCache();
  
        expect(result).toBeNull();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          { err: error },
          '[Cache] Failed to load source configurations from cache.'
        );
      });

    it('should return null and log warning for invalid JSON in cache file', async () => {
      mockFs.readFile.mockResolvedValueOnce('invalid json content');

      const result = await loadSourcesFromCache();
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(SyntaxError) }),
        '[Cache] Failed to load source configurations from cache.'
      );
    });
  });
});
