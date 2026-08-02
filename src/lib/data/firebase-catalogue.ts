import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  getFirestore,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
import { parseLegacyApplication, sortGames } from '$lib/domain/game-tile';
import { readFirebaseConfig } from './firebase-config';
import type { CatalogueSource } from './catalogue-source';

let servicesPromise: ReturnType<typeof initializeServices> | undefined;
let emulatorsConnected = false;

export async function createFirebaseCatalogue(): Promise<CatalogueSource> {
  const { db } = await (servicesPromise ??= initializeServices());
  return {
    subscribe(listener) {
      listener({ status: 'loading', games: [], rejected: [] });
      const applications = query(collection(db, 'Applications'), orderBy('Title'));
      return onSnapshot(
        applications,
        { includeMetadataChanges: true },
        (snapshot) => {
          const parsed = snapshot.docs.map((document) =>
            parseLegacyApplication(document.id, document.data())
          );
          const games = sortGames(parsed.flatMap(({ game }) => (game ? [game] : [])));
          const rejected = parsed.flatMap(({ rejected }) => (rejected ? [rejected] : []));
          listener({
            status: snapshot.metadata.fromCache ? 'offline' : games.length > 0 ? 'current' : 'empty',
            games,
            rejected
          });
        },
        () => listener({ status: 'error', games: [], rejected: [], message: 'Could not load games' })
      );
    }
  };
}

async function initializeServices() {
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
  const restoredUser = await new Promise<typeof auth.currentUser>((resolve, reject) => {
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
  if (!restoredUser) await signInAnonymously(auth);
  return { auth, db };
}
