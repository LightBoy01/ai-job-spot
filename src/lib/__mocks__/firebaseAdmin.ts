import { jest } from '@jest/globals';

const mockVerifyIdToken = jest.fn();
const mockAuth = () => ({
  verifyIdToken: mockVerifyIdToken,
});

const mockCollection = jest.fn(() => ({
  add: jest.fn(() => Promise.resolve({ id: 'test-job-id' })),
}));

const mockFirestore = () => ({
  collection: mockCollection,
});

const adminApp = {
  auth: mockAuth,
  firestore: mockFirestore,
};

const adminDb = mockFirestore();

export { adminApp, adminDb, mockVerifyIdToken, mockCollection };
