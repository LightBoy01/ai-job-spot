export interface VerifiedClaim {
  id: string;
  userId: string;
  platform: 'GITHUB' | 'HUGGING_FACE' | 'KAGGLE';
  category: 'AI_ENGINEERING' | 'OPEN_SOURCE_CONTRIBUTION' | 'MODEL_TRAINING';
  assertion: string; // The human-readable claim
  evidence: {
    sourceUrl: string;
    snapshotHash: string;
    dataSummary: Record<string, unknown>;
  };
  verificationStatus: {
    verified: boolean;
    timestamp: string; // ISO date
    method: 'OAUTH_API_DIRECT_READ';
    confidenceScore: number; // 0.0 to 1.0
  };
}

export interface GithubRepoSummary {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  isFork: boolean;
  url: string;
  updatedAt: string; // ISO date for activity tracking
}

export interface DeveloperDNA {
  topLanguages: { name: string; percentage: number; color?: string }[];
  archetype: string;
  activeReposCount: number; // Repos updated recently
  totalStars: number;
  userType: 'Builder' | 'Architect' | 'Researcher' | 'Explorer';
}

export interface VerificationResult {
  claims: VerifiedClaim[];
  dna: DeveloperDNA;
}