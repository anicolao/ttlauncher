# Authentication design

## Decision

Use Firebase anonymous authentication silently in every environment. There is
no sign-in route, account prompt, profile, Google link, sign-out control, or
identity-dependent launcher feature.

Anonymous does not mean unauthenticated: every Firestore read carries a Firebase
ID token and UID, so LauncherUI's existing `request.auth != null` catalogue rule
continues to apply without weakening backend security.

## Startup state machine

```text
booting
  │ wait for Firebase's first auth-state observation
  ├── existing anonymous user ───────────────────► ready
  ├── no user ── signInAnonymously ─────────────► ready
  └── init/auth failure ─────────────────────────► tabletop error state
```

The app must not call `signInAnonymously` until the first auth-state observation
confirms no persisted user. `start()` is idempotent and one observer is owned by
the app lifetime. Auth is an infrastructure gate, not a route or visible phase.

```ts
type SessionState =
  | { status: 'booting' }
  | { status: 'ready'; uid: string }
  | { status: 'error'; code: AuthErrorCode; retryable: boolean };

interface AuthSession {
  subscribe(listener: (state: SessionState) => void): () => void;
  start(): Promise<void>;
  retry(): Promise<void>;
}
```

The UID never appears on the table and is not copied into an application user
profile. It exists only to authenticate Firestore reads.

## Shared-appliance behavior

- Persist the anonymous Auth session locally so normal restarts do not create an
  unnecessary new account.
- Do not store email, display name, photo, or Firebase token in application
  storage.
- Do not write `users/{uid}` in version one.
- Clearing appliance storage simply causes a new anonymous session on next boot;
  there is no launcher data to migrate.
- No player at the table can sign out, link an account, or expose another
  player's identity because the launcher has no such surface.

## Failure presentation

Auth failures must be readable from every edge. The same concise status and
retry target are rendered four times around the perimeter, each rotated toward
its edge, while one semantic status region supplies assistive output.

| Failure | Table behavior |
| --- | --- |
| Firebase config invalid | Persistent “Launcher unavailable” perimeter state; no game tiles |
| Network absent, session restored and cache valid | Cached catalogue with repeated Offline status |
| Network absent, no session | “Connection required” with four equivalent retry targets |
| Anonymous provider disabled | Configuration error; never redirect to Google |
| Permission denied | Stop claiming freshness; retain safe cache and offer retry |
| Token refresh interruption | Show Reconnecting; resume automatically when Auth recovers |

## Security requirements

- Preserve deny-by-default Firestore rules.
- Catalogue reads require any authenticated Firebase user.
- Catalogue writes remain denied.
- Version one makes no client Firestore writes.
- Production and live-preview origins are explicitly authorized before use.
- Enable anonymous Auth in the existing Firebase project as a reversible rollout
  prerequisite; do not make the catalogue public to simulate guest access.

## Auth E2E contract

Tests use the Auth emulator and the real invisible state machine:

- first boot obtains an anonymous UID with no sign-in UI;
- reload restores the same UID;
- clearing the test context produces a different UID;
- auth-unavailable and permission-denied states show four equivalent edge-facing
  retry/status surfaces;
- catalogue subscription begins only after ready auth;
- no route, control, or visible copy offers account or profile management.
