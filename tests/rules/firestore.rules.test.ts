import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
    await setDoc(doc(context.firestore(), 'Administrators', 'catalogue-editor'), {
      Enabled: true
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

  it('denies catalogue writes from anonymous appliance sessions', async () => {
    const db = environment.authenticatedContext('table-appliance').firestore();
    await assertFails(setDoc(doc(db, 'Applications', 'new-game'), { Title: 'Nope' }));
  });

  it('allows an authorized editor to add, edit, and hide a valid application', async () => {
    const db = environment.authenticatedContext('catalogue-editor', {
      email: 'editor@example.test',
      email_verified: true
    }).firestore();
    const application = doc(db, 'Applications', 'snappy-maria');
    await assertSucceeds(setDoc(application, {
      Title: 'Snappy Maria',
      URL: 'https://games.example.test/snappy-maria',
      Hidden: false
    }));
    await assertSucceeds(updateDoc(application, { Hidden: true }));
    await assertSucceeds(updateDoc(application, { Title: 'Snappy Maria Debug' }));
  });

  it('denies writes from a signed-in account without administrator authorization', async () => {
    const db = environment.authenticatedContext('not-an-editor', {
      email: 'visitor@example.test',
      email_verified: true
    }).firestore();
    await assertFails(setDoc(doc(db, 'Applications', 'new-game'), {
      Title: 'Nope', URL: 'https://games.example.test/nope'
    }));
  });

  it('rejects unsafe editor writes and catalogue deletion', async () => {
    const db = environment.authenticatedContext('catalogue-editor').firestore();
    await assertFails(setDoc(doc(db, 'Applications', 'unsafe'), {
      Title: 'Unsafe', URL: 'javascript:alert(1)'
    }));
    await assertFails(setDoc(doc(db, 'Applications', 'credentials'), {
      Title: 'Credentials', URL: 'https://user:secret@games.example.test/private'
    }));
    await assertFails(setDoc(doc(db, 'Applications', 'untitled'), {
      Title: '   ', URL: 'https://games.example.test/untitled'
    }));
    await assertFails(updateDoc(doc(db, 'Applications', 'caravan'), {
      Category: 'Not part of the launcher contract'
    }));
    await assertFails(deleteDoc(doc(db, 'Applications', 'caravan')));
  });

  it('allows an account to check only its own editor authorization', async () => {
    const editor = environment.authenticatedContext('catalogue-editor').firestore();
    const visitor = environment.authenticatedContext('not-an-editor').firestore();
    await assertSucceeds(getDoc(doc(editor, 'Administrators', 'catalogue-editor')));
    await assertFails(getDoc(doc(visitor, 'Administrators', 'catalogue-editor')));
  });

  it('denies reads outside the legacy catalogue', async () => {
    const db = environment.authenticatedContext('table-appliance').firestore();
    await assertFails(getDoc(doc(db, 'Users', 'table-appliance')));
  });
});
