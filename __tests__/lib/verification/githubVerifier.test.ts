import { analyzeGithubPortfolio } from '../../../src/lib/verification/githubVerifier';
import { GithubRepoSummary } from '../../../src/lib/verification/types';

describe('GitHub AI Verification', () => {
  const mockUserId = 'user_123';

  it('should generate a claim for a significant AI repository', () => {
    const repos: GithubRepoSummary[] = [
      {
        name: 'awesome-rag',
        description: 'A RAG implementation using LangChain',
        stars: 15,
        forks: 2,
        language: 'Python',
        topics: ['rag', 'machine-learning'],
        isFork: false,
        url: 'https://github.com/user/awesome-rag',
      },
      {
        name: 'personal-website',
        description: 'My blog',
        stars: 100,
        forks: 0,
        language: 'TypeScript',
        topics: [],
        isFork: false,
        url: 'https://github.com/user/personal-website',
      }
    ];

    const claims = analyzeGithubPortfolio(repos, mockUserId);
    
    expect(claims.length).toBeGreaterThan(0);
    const aiClaim = claims.find(c => c.assertion.includes('awesome-rag'));
    expect(aiClaim).toBeDefined();
    expect(aiClaim?.category).toBe('AI_ENGINEERING');
    expect(aiClaim?.evidence.dataSummary).toEqual({
        repoName: 'awesome-rag',
        stars: 15,
        topics: ['rag', 'machine-learning']
    });
  });

  it('should NOT generate a claim for non-AI repositories', () => {
    const repos: GithubRepoSummary[] = [
      {
        name: 'react-todo',
        description: 'A simple todo app',
        stars: 50,
        forks: 5,
        language: 'JavaScript',
        topics: ['react'],
        isFork: false,
        url: 'https://github.com/user/react-todo',
      }
    ];

    const claims = analyzeGithubPortfolio(repos, mockUserId);
    expect(claims.length).toBe(0);
  });

  it('should generate an "Active AI Engineer" claim for multiple AI repos', () => {
      const repos: GithubRepoSummary[] = [
        { name: 'ai-1', description: 'nlp tool', stars: 1, forks: 0, language: 'Python', topics: ['nlp'], isFork: false, url: 'url1' },
        { name: 'ai-2', description: 'cv tool', stars: 1, forks: 0, language: 'Python', topics: ['computer-vision'], isFork: false, url: 'url2' },
        { name: 'ai-3', description: 'torch tool', stars: 1, forks: 0, language: 'Python', topics: ['pytorch'], isFork: false, url: 'url3' },
      ];
  
      const claims = analyzeGithubPortfolio(repos, mockUserId);
      const ecosystemClaim = claims.find(c => c.assertion.includes('Active AI Engineer'));
      expect(ecosystemClaim).toBeDefined();
      expect(ecosystemClaim?.evidence.dataSummary).toHaveProperty('repoCount', 3);
    });
});
