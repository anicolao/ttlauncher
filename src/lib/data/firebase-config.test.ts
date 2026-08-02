import { describe, expect, it } from 'vitest';
import { readFirebaseConfig } from './firebase-config';

const required = {
  PUBLIC_FIREBASE_API_KEY: 'key',
  PUBLIC_FIREBASE_AUTH_DOMAIN: 'ttlauncher-e2e.firebaseapp.com',
  PUBLIC_FIREBASE_PROJECT_ID: 'ttlauncher-e2e',
  PUBLIC_FIREBASE_APP_ID: '1:123:web:e2e'
};

describe('Firebase public configuration', () => {
  it('accepts the services required by Auth and Firestore', () => {
    expect(readFirebaseConfig(required)).toMatchObject({
      apiKey: 'key', projectId: 'ttlauncher-e2e', appId: '1:123:web:e2e'
    });
  });

  it('fails closed when a required public field is absent', () => {
    expect(() => readFirebaseConfig({ ...required, PUBLIC_FIREBASE_API_KEY: '' }))
      .toThrow('PUBLIC_FIREBASE_API_KEY');
  });
});
