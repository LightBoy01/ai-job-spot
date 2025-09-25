import { NextApiRequest, NextApiResponse } from 'next';
import httpMocks from 'node-mocks-http';
import searchHandler from '@/pages/api/jobs/search';

// --- Mock Data ---
const mockJobs = [
  {
    id: 'job-1',
    data: () => ({
      title: 'AI Engineer',
      status: 'published',
      postedDate: {
        toDate: () => new Date('2025-09-23T10:00:00Z'),
      },
    }),
  },
  {
    id: 'job-2',
    data: () => ({
      title: 'ML Researcher',
      status: 'published',
      postedDate: {
        toDate: () => new Date('2025-09-22T10:00:00Z'),
      },
    }),
  },
];

// --- Mocks ---
const mockGet = jest.fn().mockResolvedValue({ docs: mockJobs });

jest.mock('@/lib/firebaseAdmin', () => ({
  __esModule: true,
  adminDb: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: mockGet,
          })),
          get: mockGet, // For queries without a limit
        })),
        get: mockGet, // For queries without ordering
      })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
            get: mockGet,
        })),
        get: mockGet,
      })),
      get: mockGet, // For the base collection query
    })),
  },
}));

describe('/api/jobs/search API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 Method Not Allowed for non-GET requests', async () => {
    const { req, res } = httpMocks.createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await searchHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData().message).toBe('Method not allowed');
  });

  it('should return 200 OK with jobs for a valid GET request', async () => {
    const { req, res } = httpMocks.createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        limit: '10',
      },
    });

    await searchHandler(req, res);

    expect(res.statusCode).toBe(200);
    const responseData = res._getJSONData();
    expect(responseData.jobs).toHaveLength(2);
    expect(responseData.jobs[0].title).toBe('AI Engineer');
    expect(mockGet).toHaveBeenCalled();
  });

  it('should return 400 Bad Request for invalid query parameters', async () => {
    const { req, res } = httpMocks.createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: {
        limit: 'not-a-number', // Invalid limit
      },
    });

    await searchHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toBe('Invalid query parameters.');
  });
});
