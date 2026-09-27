import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import { parseHttpsUrl, parseIconUrl } from '$lib/domain/game-tile';
import { getFirebaseServices } from './firebase-client';

export interface EditableApplication {
  id: string;
  title: string;
  url: string;
  icon: string;
  hidden: boolean;
}

export interface ApplicationDraft {
  title: string;
  url: string;
  icon: string;
}

export type EditorSession =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'authorized'; email: string }
  | { status: 'denied'; email: string }
  | { status: 'error'; message: string };

export const CATALOGUE_EDITOR_EMAILS = [
  'anicolao@gmail.com',
  'egirard@gmail.com'
] as const;

export type EditorApplications =
  | { status: 'loading'; applications: EditableApplication[] }
  | { status: 'ready'; applications: EditableApplication[] }
  | { status: 'error'; applications: EditableApplication[]; message: string };

export interface CatalogueEditor {
  subscribeSession(listener: (session: EditorSession) => void): () => void;
  subscribeApplications(listener: (state: EditorApplications) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  addApplication(draft: ApplicationDraft): Promise<void>;
  updateApplication(id: string, draft: ApplicationDraft): Promise<void>;
  setApplicationHidden(id: string, hidden: boolean): Promise<void>;
}

export async function createCatalogueEditor(): Promise<CatalogueEditor> {
  if (import.meta.env.PUBLIC_EDITOR_ENABLED !== 'true') {
    throw new Error('The catalogue editor is disabled in this build.');
  }
  const { auth, db } = await getFirebaseServices();
  const applications = collection(db, 'Applications');

  return {
    subscribeSession(listener) {
      listener({ status: 'loading' });
      return onAuthStateChanged(
        auth,
        (user) => {
          if (!user || user.isAnonymous) {
            listener({ status: 'signed-out' });
            return;
          }

          const email = user.email ?? 'Signed-in account';
          listener(isCatalogueEditor(email, user.emailVerified)
            ? { status: 'authorized', email }
            : { status: 'denied', email });
        },
        () => listener({ status: 'error', message: 'Could not restore the sign-in session.' })
      );
    },

    subscribeApplications(listener) {
      listener({ status: 'loading', applications: [] });
      return onSnapshot(
        query(applications, orderBy('Title')),
        (snapshot) => listener({
          status: 'ready',
          applications: snapshot.docs.map((item) => toEditableApplication(item.id, item.data()))
        }),
        () => listener({
          status: 'error',
          applications: [],
          message: 'Could not load the catalogue.'
        })
      );
    },

    async signIn() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    },

    async signOut() {
      await signOut(auth);
    },

    async addApplication(draft) {
      const normalized = validateDraft(draft);
      await addDoc(applications, {
        Title: normalized.title,
        URL: normalized.url,
        ...(normalized.icon ? { Icon: normalized.icon } : {}),
        Hidden: false
      });
    },

    async updateApplication(id, draft) {
      const normalized = validateDraft(draft);
      await updateDoc(doc(applications, id), {
        Title: normalized.title,
        URL: normalized.url,
        Icon: normalized.icon || deleteField()
      });
    },

    async setApplicationHidden(id, hidden) {
      await updateDoc(doc(applications, id), { Hidden: hidden });
    }
  };
}

export function isCatalogueEditor(email: string | null, emailVerified: boolean): boolean {
  return emailVerified
    && email !== null
    && CATALOGUE_EDITOR_EMAILS.includes(email as typeof CATALOGUE_EDITOR_EMAILS[number]);
}

export function validateDraft(draft: ApplicationDraft): ApplicationDraft {
  const title = draft.title.trim();
  if (!title) throw new Error('Enter a title.');
  if (title.length > 120) throw new Error('Keep the title to 120 characters or fewer.');

  const url = parseHttpsUrl(draft.url);
  if (!url) throw new Error('Enter a valid HTTPS launch URL without credentials.');

  const rawIcon = draft.icon.trim();
  let icon = '';
  if (rawIcon) {
    const parsedIcon = parseIconUrl(rawIcon);
    if (!parsedIcon) {
      throw new Error('Enter an HTTPS or site-relative icon URL, or leave the icon blank.');
    }
    icon = parsedIcon;
  }

  return { title, url, icon };
}

function toEditableApplication(id: string, value: DocumentData): EditableApplication {
  return {
    id,
    title: typeof value.Title === 'string' ? value.Title : '',
    url: typeof value.URL === 'string' ? value.URL : '',
    icon: typeof value.Icon === 'string' ? value.Icon : '',
    hidden: value.Hidden === true
  };
}
