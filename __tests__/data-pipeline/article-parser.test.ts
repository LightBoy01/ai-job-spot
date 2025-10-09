import { fetchAndParseArticle } from '../../src/data-pipeline/parsers/article-parser';
import * as gotScraping from 'got-scraping';

// Mock the entire got-scraping module
jest.mock('got-scraping', () => ({
  gotScraping: jest.fn(),
}));

describe('fetchAndParseArticle', () => {
  // Restore mocks after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should extract and parse a simple article using Readability', async () => {
    const mockHtml = `
      <html>
        <head><title>Test Article</title></head>
        <body>
          <header>Some header content</header>
          <main>
            <h1>Main Article Title</h1>
            <div class="prose">
              <p>This is the first paragraph of the main content. It is long enough to pass the length check.</p>
              <p>This is the second paragraph, which should also be included. It is also long enough.</p>
              <a href="#">A link</a>
            </div>
          </main>
          <footer>Copyright notice</footer>
        </body>
      </html>
    `;

    // Setup the mock for gotScraping
    (gotScraping.gotScraping as jest.Mock).mockResolvedValue({ body: mockHtml });

    const markdown = await fetchAndParseArticle('http://example.com/article');

    // Assertions
    expect(markdown).toContain('# Test Article');
    expect(markdown).toContain('This is the first paragraph');
    expect(markdown).toContain('This is the second paragraph');
    expect(markdown).not.toContain('Some header content');
    expect(markdown).not.toContain('Copyright notice');
    // Check if the link is preserved in Markdown
    expect(markdown).toContain('[A link](#)');
  });

  it('should throw an error if Readability cannot find content', async () => {
    const mockHtml = '<html><body><p>Not enough content</p></body></html>';
    (gotScraping.gotScraping as jest.Mock).mockResolvedValue({ body: mockHtml });

    await expect(fetchAndParseArticle('http://example.com/empty')).rejects.toThrow(
      'Could not extract article content using Readability.'
    );
  });

  it('should throw an error for very short generated markdown', async () => {
    const mockHtml = `
      <html>
        <head><title>Short Article</title></head>
        <body>
          <article>
            <h1>Short</h1>
            <p>This is a short article that should fail the length check.</p>
          </article>
        </body>
      </html>
    `;
    (gotScraping.gotScraping as jest.Mock).mockResolvedValue({ body: mockHtml });

    await expect(fetchAndParseArticle('http://example.com/short')).rejects.toThrow(
      'Generated markdown for http://example.com/short is too short, likely indicating a failed scrape.'
    );
  });

  it('should parse content from a div when no article or main tag is present', async () => {
    const mockHtml = `
      <html>
        <head><title>Div-based Article</title></head>
        <body>
          <div class="main-content">
            <h2>Article in a Div</h2>
            <p>This content is directly inside a div, not a main or article tag. It needs to be long enough to be considered content by readability.</p>
            <p>And here is another paragraph to make sure it passes the length check.</p>
          </div>
        </body>
      </html>
    `;
    (gotScraping.gotScraping as jest.Mock).mockResolvedValue({ body: mockHtml });

    const markdown = await fetchAndParseArticle('http://example.com/div-article');

    expect(markdown).toContain('# Div-based Article');
    expect(markdown).toContain('Article in a Div');
    expect(markdown).toContain('This content is directly inside a div');
  });

  it('should correctly parse complex markdown elements', async () => {
    const mockHtml = `
      <html>
        <head><title>Complex Article</title></head>
        <body>
          <article>
            <h1>Complex Markdown</h1>
            <p>This article contains various markdown elements.</p>
            <pre><code>const x = 1;</code></pre>
            <blockquote>This is a blockquote.</blockquote>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </article>
        </body>
      </html>
    `;
    (gotScraping.gotScraping as jest.Mock).mockResolvedValue({ body: mockHtml });

    const markdown = await fetchAndParseArticle('http://example.com/complex-article');

    expect(markdown).toContain('# Complex Article');
    expect(markdown).toContain('```\nconst x = 1;\n```');
    expect(markdown).toContain('> This is a blockquote.');
    expect(markdown).toContain('*   Item 1');
    expect(markdown).toContain('*   Item 2');
  });
});