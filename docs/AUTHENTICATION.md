# Authentication design

## Decision

Use Firebase anonymous authentication silently on the tabletop launcher in every
environment. There is no account prompt, profile, Google link, sign-out control,
or identity-dependent launcher feature on that route.

The separately addressed `/edit` maintenance route uses Google sign-in and an
explicit `catalogueEditor: true` field on the signed-in account's
`users/{uid}` document. Firestore Rules enforce that field and prevent clients
from adding or changing it themselves. This does not place identity controls on
the tabletop surface; see ADR 0005.

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
- Catalogue writes are denied except for validated creates and updates by an
  authenticated user whose profile explicitly grants catalogue editor access.
- Deletes and writes outside the approved editor fields remain denied.
- Production and live-preview origins are explicitly authorized before use.
- Keep anonymous Auth enabled in the existing Firebase project; do not make the
  catalogue public to simulate guest access.

## Live-read configuration

Anonymous authentication was enabled for the existing `launcherui` Firebase
project on 2026-08-03. The `anicolao.github.io` preview origin was added to the
project's authorized domains at the same time. The tabletop path preserves the
existing Firestore boundary: authenticated clients may read `Applications`,
while only the separately authorized editor adapter has a client write path.

The PR deployment receives only Firebase's public web-app configuration through
GitHub Actions secrets. It receives no service-account credential, Admin SDK
credential, or refresh token. Firestore Rules permit catalogue mutations only
when the authenticated UID's `users/{uid}` document has `catalogueEditor: true`.
Automated tests do not use this configuration and continue to run against the
Auth and Firestore emulators.

## Editor setup

1. Enable Google as a Firebase Authentication provider for the existing project.
2. Merge the `Applications` rules from this repository into the project's
   deployed rules without replacing unrelated LauncherUI rules, then deploy the
   reviewed result.
3. Visit `/ttlauncher/edit` in production or a same-repository PR preview and
   sign in with the intended Google account. The editor records the account's
   Firebase Auth email on its own `users/{uid}` document and shows the UID while
   access is pending.
4. Using the Firebase console or Admin SDK, set `catalogueEditor` to `true` on
   that exact user document. The authorized accounts are currently
   `anicolao@gmail.com` and `eugene.girard@gmail.com`; email is informational and
   is not the authorization key.
5. To revoke access, use the Firebase console or Admin SDK to remove the field or
   set it to `false`. Client rules reject all attempts to change this field.

## Auth E2E contract

Tests use the Auth emulator and the real invisible state machine:

- first boot obtains an anonymous UID with no sign-in UI;
- reload restores the same UID;
- clearing the test context produces a different UID;
- auth-unavailable and permission-denied states show four equivalent edge-facing
  retry/status surfaces;
- catalogue subscription begins only after ready auth;
- the tabletop route offers no account or profile management; and
- the editor proves signed-out, denied-before-grant, authorized create/update,
  hide/show, and sign-out behavior with an emulator-only session and emulator
  data.
