import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  type Auth,
  type User
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { readFirebaseConfig } from './firebase-config';

export interface FirebaseServices {
  auth: Auth;
  db: Firestore;
}

let servicesPromise: Promise<FirebaseServices> | undefined;
let emulatorsConnected = false;

export function getFirebaseServices(): Promise<FirebaseServices> {
  return servicesPromise ??= initializeServices();
}

export async function ensureFirebaseSession(): Promise<FirebaseServices> {
  const services = await getFirebaseServices();
  const restoredUser = await firstAuthState(services.auth);
  if (!restoredUser) await signInAnonymously(services.auth);
  return services;
}

function firstAuthState(auth: Auth): Promise<User | null> {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
}

async function initializeServices(): Promise<FirebaseServices> {
  const environment = import.meta.env as Record<string, unknown>;
  const app = getApps().length > 0 ? getApp() : initializeApp(readFirebaseConfig(environment));
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (environment.PUBLIC_USE_FIREBASE_EMULATORS === 'true' && !emulatorsConnected) {
    connectAuthEmulator(
      auth,
      `http://${environment.PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1'}:${environment.PUBLIC_FIREBASE_AUTH_EMULATOR_PORT ?? '9195'}`,
      { disableWarnings: true }
    );
    connectFirestoreEmulator(
      db,
      String(environment.PUBLIC_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1'),
      Number(environment.PUBLIC_FIRESTORE_EMULATOR_PORT ?? '8195')
    );
    emulatorsConnected = true;
  }

  await setPersistence(auth, browserLocalPersistence);
  return { auth, db };
}
