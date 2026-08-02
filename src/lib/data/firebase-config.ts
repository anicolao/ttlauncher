import type { FirebaseOptions } from 'firebase/app';

const requiredFields = {
  apiKey: 'PUBLIC_FIREBASE_API_KEY',
  authDomain: 'PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'PUBLIC_FIREBASE_PROJECT_ID',
  appId: 'PUBLIC_FIREBASE_APP_ID'
} as const;

const optionalFields = {
  storageBucket: 'PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
} as const;

export function readFirebaseConfig(environment: Record<string, unknown>): FirebaseOptions {
  const config = Object.fromEntries(
    [...Object.entries(requiredFields), ...Object.entries(optionalFields)]
      .map(([field, variable]) => [field, environment[variable]])
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
  ) as Record<string, unknown>;
  const missing = Object.entries(requiredFields)
    .filter(([, variable]) => typeof environment[variable] !== 'string' || environment[variable] === '')
    .map(([, variable]) => variable);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }
  return config as FirebaseOptions;
}
