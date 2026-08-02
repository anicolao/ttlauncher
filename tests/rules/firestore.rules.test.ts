import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFile } from 'node:fs/promises';

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'ttlauncher-e2e',
    firestore: {
      rules: await readFile('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8195
    }
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'Applications', 'caravan'), {
      Title: 'Caravan', Icon: '/icons/caravan.svg', URL: 'https://games.example.test/caravan'
    });
  });
});

afterAll(async () => environment.cleanup());

describe('catalogue rules', () => {
  it('allows an authenticated appliance to read Applications', async () => {
    const db = environment.authenticatedContext('table-appliance').firestore();
    await assertSucceeds(getDoc(doc(db, 'Applications', 'caravan')));
  });

  it('denies unauthenticated reads', async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'Applications', 'caravan')));
  });

  it('denies all client writes', async () => {
    const db = environment.authenticatedContext('table-appliance').firestore();
    await assertFails(setDoc(doc(db, 'Applications', 'new-game'), { Title: 'Nope' }));
  });

  it('denies reads outside the legacy catalogue', async () => {
    const db = environment.authenticatedContext('table-appliance').firestore();
    await assertFails(getDoc(doc(db, 'Users', 'table-appliance')));
  });
});
