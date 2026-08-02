# Authentication design

## Decision

Use Firebase Auth anonymously by default, then offer an optional Google account
upgrade from the profile surface. This borrows Jaipur's low-friction entrance
while retaining LauncherUI's cross-device identity option.

Anonymous does not mean unauthenticated: every Firestore request still carries
a Firebase ID token and UID, so the existing `request.auth != null` catalogue
rule and UID-owned `users/{uid}` rule continue to apply.

## Startup state machine

```text
booting
  │ wait for Firebase's first auth-state result
  ├── existing user ───────────────────────────────► ready
  ├── no user ── signInAnonymously ───────────────► ready
  └── init/auth failure ───────────────────────────► recoverable error

ready (anonymous) ── optional link with Google ───► ready (identified)
ready (identified) ── sign out ── confirm impact ─► new anonymous session
```

The application must not call `signInAnonymously` until the first auth-state
observation has confirmed that no persisted user exists. This prevents a brief
startup race from replacing or obscuring a restored account.

## Runtime API

The UI consumes an `AuthSession` service rather than Firebase directly:

```ts
type SessionState =
  | { status: 'booting' }
  | { status: 'ready'; uid: string; kind: 'anonymous' | 'google'; profile: Profile }
  | { status: 'error'; code: AuthErrorCode; retryable: boolean };

interface AuthSession {
  subscribe(listener: (state: SessionState) => void): () => void;
  start(): Promise<void>;
  upgradeWithGoogle(): Promise<void>;
  signOutToNewGuest(): Promise<void>;
}
```

`start()` is idempotent. There is one auth observer for the app lifetime, owned
by the root layout. Routes render explicit booting and failure states instead
of redirect loops.

## Google upgrade

1. Begin with `linkWithPopup(currentUser, googleCredential)` so a new Google
   link preserves the anonymous UID and its `users/{uid}` preferences.
2. If Firebase reports `credential-already-in-use`, show a clear choice to use
   the existing account. On confirmation:
   - read and hold the anonymous user's preferences in memory;
   - sign in with the existing Google credential;
   - merge only user-owned preference fields according to documented rules;
   - write to the identified user's `users/{uid}` document; and
   - record a client-visible completion result, without storing the credential.
3. A cancelled popup leaves the anonymous session and data untouched.
4. Never auto-link based only on matching email text.

Merge rules are deterministic: union favourites, keep the most recent valid
`lastPlayed` entry per game, and prefer explicit identified-account display
settings over guest defaults. Unit and emulator rules tests cover every branch.

## Sign-out semantics

“Sign out” is labelled “Use as guest” because the app must create a fresh
anonymous session to retain catalogue access. Before proceeding, explain that
preferences attached only to the current anonymous UID may no longer be
reachable. Identified account data is retained and can be restored by linking
again.

## Storage and privacy

- Firebase Auth persistence is `indexedDBLocalPersistence` in supported
  browsers, with documented fallback behavior.
- Store preferences in `users/{uid}` and a bounded, non-sensitive catalogue
  cache in IndexedDB.
- Do not put Firebase tokens, email addresses, auth credentials, or full user
  documents in localStorage.
- Do not add analytics or cross-site tracking in version one.
- Account photos are optional remote content; use a generated initial when
  unavailable and do not make the launch path depend on the image host.

## Failure behavior

| Failure | User experience | Retry |
| --- | --- | --- |
| Firebase config invalid | Full-page setup error with support code | Reload after deployment fix |
| Network absent, restored session exists | Cached library with Offline badge | Automatic plus manual retry |
| Network absent, no session exists | Explain that a first connection is required | Manual retry |
| Anonymous provider disabled | Configuration error, not a Google redirect | Deployment fix |
| Popup blocked/cancelled | Inline message; guest session remains active | User initiated |
| Token expires | Firebase refreshes; catalogue listener shows reconnecting | Automatic |
| Permission denied | Safe error with no stale claim of freshness | Manual after auth settles |

## Security requirements

- Keep the existing deny-by-default rules shape.
- Catalogue reads require any authenticated Firebase user.
- User preference reads/writes require `request.auth.uid == uid` and a strict
  field/schema validator before implementation ships.
- Admin catalogue writes happen outside the browser client.
- Production and preview origins must be explicitly listed in Firebase Auth
  authorized domains before live auth previews are enabled.
- Enable anonymous auth in the existing Firebase project as a reversible
  rollout prerequisite; do not weaken Firestore rules to simulate guest access.

## Auth E2E contract

Tests use the Auth emulator and exercise the real UI state machine:

- first visit silently obtains an anonymous UID;
- reload restores the same UID and preferences;
- two browser contexts receive distinct UIDs;
- a mocked/emulator Google-link result preserves the UID;
- collision merge preserves both sets of favourites;
- sign-out confirmation produces a different guest UID;
- auth-unavailable and permission-denied states are actionable;
- no E2E-only sign-in button or route exists.
