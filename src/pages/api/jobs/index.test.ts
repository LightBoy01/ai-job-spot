const mockCollection = jest.fn(() => ({
  add: jest.fn(() => Promise.resolve({ id: 'test-job-id' })),
}));

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(() => ({
    auth: () => ({
      verifyIdToken: jest.fn(), // This will be spied on
    }),
    firestore: () => ({
      collection: mockCollection,
    }),
  })),
  app: jest.fn(() => ({
    auth: () => ({
      verifyIdToken: jest.fn(), // This will be spied on
    }),
    firestore: () => ({
      collection: mockCollection,
    }),
  })),
  credential: {
    cert: jest.fn(() => ({})),
  },
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp'),
    },
    Timestamp: {
      fromDate: jest.fn((date) => date),
    },
  },
}));

import { createRequest, createResponse } from 'node-mocks-http';
import handler from './index';

describe('Job API - POST /api/jobs', () => {
  let verifyIdTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyIdTokenSpy = jest.spyOn(admin.app().auth(), 'verifyIdToken');
  });

  it('should return 401 if no authorization token is provided', async () => {
    // No token provided, so no mockResolvedValueOnce needed for verifyIdToken
    const req = createRequest({
      method: 'POST',
      headers: {},
      body: {},
    });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Unauthorized: No token provided' });
  });

  it('should return 401 if the authorization token is invalid', async () => {
    verifyIdTokenSpy.mockRejectedValueOnce(new Error('Invalid token'));

    const req = createRequest({
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
      body: {},
    });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Unauthorized: Invalid token' });
  });

  it('should return 403 if the user is not an admin', async () => {
    verifyIdTokenSpy.mockResolvedValueOnce({ uid: 'test-user-id', admin: false });

    const req = createRequest({
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-user-token',
      },
      body: {},
    });
    const res = createResponse();

    await handler(req, res);

    console.log('403 Test - Status Code:', res.statusCode);
    console.log('403 Test - JSON Data:', res._getJSONData());

    expect(res.statusCode).toBe(403);
    expect(res._getJSONData()).toEqual({ error: 'Forbidden: User is not an admin' });
  });

  it('should return 400 if required fields are missing', async () => {
    verifyIdTokenSpy.mockResolvedValueOnce({ uid: 'test-admin-id-400', admin: true });

    const req = createRequest({
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: {},
    });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Missing required fields' });
  });

  it('should create a new job posting if authenticated as admin and all fields are provided', async () => {
    verifyIdTokenSpy.mockResolvedValueOnce({ uid: 'test-admin-id-201', admin: true });

    const mockJobData = {
      title: 'Test Job',
      company: 'Test Company',
      description: 'Test Description',
      location: 'Test Location',
      applicationLink: 'http://test.com',
      tags: ['test'],
      expirationDate: null,
    };

    const req = createRequest({
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: mockJobData,
    });
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual({ id: 'test-job-id' });
    expect(mockCollection).toHaveBeenCalledWith('jobs');
    expect(mockCollection('jobs').add).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Job',
      company: 'Test Company',
      description: expect.any(String), // DOMPurify sanitizes, so check for string
    }));
  });
});
