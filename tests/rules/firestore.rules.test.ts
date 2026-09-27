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
      email: 'anicolao@gmail.com',
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

  it('allows the second approved verified editor email', async () => {
    const db = environment.authenticatedContext('second-editor', {
      email: 'egirard@gmail.com',
      email_verified: true
    }).firestore();
    await assertSucceeds(setDoc(doc(db, 'Applications', 'second-editor-game'), {
      Title: 'Second Editor Game', URL: 'https://games.example.test/second-editor-game'
    }));
  });

  it('denies writes from a signed-in account outside the email allow-list', async () => {
    const db = environment.authenticatedContext('not-an-editor', {
      email: 'visitor@example.test',
      email_verified: true
    }).firestore();
    await assertFails(setDoc(doc(db, 'Applications', 'new-game'), {
      Title: 'Nope', URL: 'https://games.example.test/nope'
    }));
  });

  it('rejects unsafe editor writes and catalogue deletion', async () => {
    const db = environment.authenticatedContext('catalogue-editor', {
      email: 'anicolao@gmail.com',
      email_verified: true
    }).firestore();
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

  it('denies an allow-listed email without a verified provider claim', async () => {
    const db = environment.authenticatedContext('unverified-editor', {
      email: 'anicolao@gmail.com',
      email_verified: false
    }).firestore();
    await assertFails(setDoc(doc(db, 'Applications', 'unverified-game'), {
      Title: 'Nope', URL: 'https://games.example.test/nope'
    }));
  });

  it('denies reads outside the legacy catalogue', async () => {
    const db = environment.authenticatedContext('table-appliance').firestore();
    await assertFails(getDoc(doc(db, 'Users', 'table-appliance')));
  });

  it('preserves existing access to an account own lowercase users document', async () => {
    const owner = environment.authenticatedContext('table-appliance').firestore();
    const other = environment.authenticatedContext('other-appliance').firestore();
    await assertSucceeds(setDoc(doc(owner, 'users', 'table-appliance'), { theme: 'legacy' }));
    await assertSucceeds(getDoc(doc(owner, 'users', 'table-appliance')));
    await assertFails(getDoc(doc(other, 'users', 'table-appliance')));
  });
});
