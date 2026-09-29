import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function grantCatalogueEditorAccess(uid: string, email: string): Promise<void> {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Refusing to grant editor access without the Firestore emulator.');
  }

  const app = getApps()[0] ?? initializeApp({ projectId: 'ttlauncher-e2e' });
  await getFirestore(app).doc(`users/${uid}`).set({
    email,
    catalogueEditor: true
  }, { merge: true });
}
