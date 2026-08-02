import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { applications } from '../tests/fixtures/applications.mjs';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Refusing to seed without FIRESTORE_EMULATOR_HOST');
}

const app = getApps()[0] ?? initializeApp({
  credential: applicationDefault(),
  projectId: 'ttlauncher-e2e'
});
const firestore = getFirestore(app);
const batch = firestore.batch();

for (const [id, title, icon] of applications) {
  batch.set(firestore.collection('Applications').doc(id), {
    Title: title,
    Icon: `/icons/${icon}.svg`,
    URL: `https://games.example.test/${id}`
  });
}

await batch.commit();
console.log(`Seeded ${applications.length} Applications documents.`);
