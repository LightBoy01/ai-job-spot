import { createRequest, createResponse } from 'node-mocks-http';
import handler from './post';
import admin from 'firebase-admin';

describe('Job API - POST /api/jobs/post', () => {
  let verifyIdTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyIdTokenSpy = jest.spyOn(admin.auth(), 'verifyIdToken');
  });

  it('should return 401 if no authorization token is provided', async () => {
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
    expect(admin.firestore().collection).toHaveBeenCalledWith('jobs');
    expect(admin.firestore().collection('jobs').add).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Job',
      company: 'Test Company',
      description: expect.any(String), // DOMPurify sanitizes, so check for string
    }));
  }, 10000);
});
