import { getJobSources } from '@/data-pipeline/pipeline.config.jobs';
import { loadAndValidateSourceConfigs } from '@/data-pipeline/utils/getConfig';
import { sourceAdapterFactory } from '@/data-pipeline/source-adapter-factory';
import { loadSourcesFromCache, saveSourcesToCache } from '@/data-pipeline/utils/source-cache';
import { IJobSource } from '@/data-pipeline/types';

// Mock the dependencies
jest.mock('@/data-pipeline/utils/getConfig');
jest.mock('@/data-pipeline/source-adapter-factory');
jest.mock('@/data-pipeline/utils/source-cache');
jest.mock('@/data-pipeline/sources/hiringCafe.js', () => ({
  hiringCafeSource: {
    name: 'mock-hiring.cafe',
    fetchJobs: jest.fn(),
    transform: jest.fn(),
  },
}));
jest.mock('@/data-pipeline/utils/logger.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Type-safe mock functions
const mockedLoadAndValidate = loadAndValidateSourceConfigs as jest.Mock;
const mockedCreateSource = sourceAdapterFactory.createSource as jest.Mock;
const mockedLoadFromCache = loadSourcesFromCache as jest.Mock;
const mockedSaveToCache = saveSourcesToCache as jest.Mock;

describe('getJobSources', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should fetch sources from Firestore, save to cache, and return transformed sources when cache is empty', async () => {
    // Arrange
    const mockFirestoreSources = [
      { id: '1', sourceName: 'Test Job Source', type: 'Job', adapter: 'HiringCafe', status: 'Active' },
    ];
    const mockTransformedSource: IJobSource = {
      name: 'Test Job Source', 
      fetchJobs: jest.fn(),
      transform: jest.fn(),
    };

    mockedLoadFromCache.mockResolvedValue(null);
    mockedLoadAndValidate.mockResolvedValue(mockFirestoreSources);
    mockedCreateSource.mockReturnValue(mockTransformedSource);

    // Act
    const sources = await getJobSources();

    // Assert
    expect(mockedLoadFromCache).toHaveBeenCalledTimes(1);
    expect(mockedLoadAndValidate).toHaveBeenCalledTimes(1);
    expect(mockedSaveToCache).toHaveBeenCalledWith(mockFirestoreSources);
    expect(mockedCreateSource).toHaveBeenCalledWith({
      name: 'Test Job Source', 
      adapter: 'HiringCafe',
      config: { ...mockFirestoreSources[0] }
    });
    expect(sources).toHaveLength(1);
    expect(sources[0]).toEqual(mockTransformedSource);
  });

  it('should return sources from cache when available', async () => {
    // Arrange
    const mockCachedSources = [
      { id: '2', sourceName: 'Cached Job Source', type: 'Job', adapter: 'RSS', status: 'Active' },
    ];
    const mockTransformedSource: IJobSource = {
      name: 'Cached Job Source', 
      fetchJobs: jest.fn(),
      transform: jest.fn(),
    };

    mockedLoadFromCache.mockResolvedValue(mockCachedSources);
    mockedCreateSource.mockReturnValue(mockTransformedSource);

    // Act
    const sources = await getJobSources();

    // Assert
    expect(mockedLoadFromCache).toHaveBeenCalledTimes(1);
    expect(mockedLoadAndValidate).not.toHaveBeenCalled();
    expect(mockedSaveToCache).not.toHaveBeenCalled();
    expect(mockedCreateSource).toHaveBeenCalledWith({
      name: 'Cached Job Source',
      adapter: 'RSS',
      config: { ...mockCachedSources[0] }
    });
    expect(sources).toHaveLength(1);
    expect(sources[0]).toEqual(mockTransformedSource);
  });

  it('should filter out sources that are not of type Job from the cache', async () => {
    // Arrange
    const mockCachedSources = [
      { id: '1', sourceName: 'Job Source', type: 'Job', adapter: 'HiringCafe', status: 'Active' },
      { id: '2', sourceName: 'Article Source', type: 'Article', adapter: 'RSS', status: 'Active' },
    ];
    const mockTransformedSource: IJobSource = {
      name: 'Job Source', 
      fetchJobs: jest.fn(),
      transform: jest.fn(),
    };

    mockedLoadFromCache.mockResolvedValue(mockCachedSources);
    mockedCreateSource.mockReturnValue(mockTransformedSource);

    // Act
    const sources = await getJobSources();

    // Assert
    expect(sources).toHaveLength(1);
    expect(mockedCreateSource).toHaveBeenCalledTimes(1);
    expect(mockedCreateSource).toHaveBeenCalledWith(expect.objectContaining({ name: 'Job Source' }));
  });

  it('should bypass the cache and fetch from Firestore when --force-refresh is used', async () => {
    // Arrange
    process.argv.push('--force-refresh'); // Simulate command-line argument
    const mockCachedSources = [{ id: '1', sourceName: 'Cached Source', type: 'Job', adapter: 'RSS', status: 'Active' }];
    const mockFirestoreSources = [{ id: '2', sourceName: 'Firestore Source', type: 'Job', adapter: 'HiringCafe', status: 'Active' }];
    const mockTransformedSource: IJobSource = { name: 'Firestore Source', fetchJobs: jest.fn(), transform: jest.fn() };

    mockedLoadFromCache.mockResolvedValue(mockCachedSources);
    mockedLoadAndValidate.mockResolvedValue(mockFirestoreSources);
    mockedCreateSource.mockReturnValue(mockTransformedSource);

    // Act
    const sources = await getJobSources();

    // Assert
    expect(mockedLoadFromCache).toHaveBeenCalledTimes(1); // It's still called once
    expect(mockedLoadAndValidate).toHaveBeenCalledTimes(1); // But we proceed to firestore
    expect(mockedSaveToCache).toHaveBeenCalledWith(mockFirestoreSources);
    expect(sources[0].name).toBe('Firestore Source');

    // Cleanup
    process.argv.pop();
  });

  it('should return an empty array if the source factory returns null', async () => {
    // Arrange
    const mockFirestoreSources = [{ id: '1', sourceName: 'Invalid Source', type: 'Job', adapter: 'HiringCafe', status: 'Active' }];
    mockedLoadFromCache.mockResolvedValue(null);
    mockedLoadAndValidate.mockResolvedValue(mockFirestoreSources);
    mockedCreateSource.mockReturnValue(null); // Simulate factory failing to create a source

    // Act
    const sources = await getJobSources();

    // Assert
    expect(sources).toHaveLength(0);
  });

  it('should propagate errors from loadAndValidateSourceConfigs', async () => {
    // Arrange
    const errorMessage = 'Firestore is unavailable';
    mockedLoadFromCache.mockResolvedValue(null);
    mockedLoadAndValidate.mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(getJobSources()).rejects.toThrow(errorMessage);
  });
});
