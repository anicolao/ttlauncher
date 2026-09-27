import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function authorizeCatalogueEditor(uid: string) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('Refusing to authorize an editor outside the Firestore emulator');
  }
  const app = getApps()[0] ?? initializeApp({
    credential: applicationDefault(),
    projectId: 'ttlauncher-e2e'
  });
  await getFirestore(app).collection('Administrators').doc(uid).set({ Enabled: true });
}
