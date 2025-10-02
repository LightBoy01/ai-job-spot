import { fetchAndParseRss } from '../../../src/pipeline/adapters/rss-adapter';
import Parser from 'rss-parser';

// Mock the rss-parser library
jest.mock('rss-parser');

const mockParser = Parser as jest.MockedClass<typeof Parser>;

describe('RSS Adapter - fetchAndParseRss', () => {
  beforeEach(() => {
    // Clear all previous mock implementations and calls
    mockParser.prototype.parseURL.mockClear();
  });

  it('should fetch and parse a valid RSS feed into RssItem objects', async () => {
    // Arrange: Setup the mock implementation for a successful feed parse
    const mockFeed = {
      items: [
        { title: 'Test Article 1', link: 'https://example.com/1', isoDate: new Date().toISOString() },
        { title: 'Test Article 2', link: 'https://example.com/2', isoDate: new Date().toISOString() },
      ],
    };
    mockParser.prototype.parseURL.mockResolvedValue(mockFeed as any);

    // Act: Call the function with a dummy URL
    const result = await fetchAndParseRss('https://dummy-feed.com/rss.xml');

    // Assert: Verify the result
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Test Article 1');
    expect(result[1].link).toBe('https://example.com/2');
    expect(mockParser.prototype.parseURL).toHaveBeenCalledWith('https://dummy-feed.com/rss.xml');
  });

  it('should return an empty array if the feed has no items', async () => {
    // Arrange: Setup a mock feed with an empty items array
    const mockFeed = { items: [] };
    mockParser.prototype.parseURL.mockResolvedValue(mockFeed as any);

    // Act
    const result = await fetchAndParseRss('https://empty-feed.com/rss.xml');

    // Assert
    expect(result).toHaveLength(0);
  });

  it('should filter out items that are missing a title or link', async () => {
    // Arrange: Setup a mock feed with malformed items
    const mockFeed = {
      items: [
        { title: 'Good Article', link: 'https://example.com/good' },
        { title: 'Missing Link' }, // Missing link
        { link: 'https://example.com/missing-title' }, // Missing title
      ],
    };
    mockParser.prototype.parseURL.mockResolvedValue(mockFeed as any);

    // Act
    const result = await fetchAndParseRss('https://malformed-feed.com/rss.xml');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Good Article');
  });

  it('should throw an error if the parser fails', async () => {
    // Arrange: Setup the mock to reject with an error
    const errorMessage = 'Failed to fetch feed';
    mockParser.prototype.parseURL.mockRejectedValue(new Error(errorMessage));

    // Act & Assert: Expect the function to throw the error
    await expect(fetchAndParseRss('https://failing-feed.com/rss.xml')).rejects.toThrow(errorMessage);
  });
});
