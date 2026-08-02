# Source audit: LauncherUI and Jaipur

This audit was made from the local sibling repositories `../LauncherUI` and
`../jaipur` on 2026-08-02. It describes observed code, not an assumed production
configuration.

## LauncherUI today

LauncherUI is a client-only SvelteKit 2 / Svelte 4 application using Firebase
Auth and Firestore. `src/routes/+layout.ts` disables SSR and prerenders the
static client.

The startup path is:

1. `/` redirects to `/signin` after mount.
2. Production and staging render `@ourway/svelte-firebase-auth` with a
   `GoogleAuthProvider`.
3. Local mode exposes a bespoke “Continue with Emulator” button that calls
   `signInAnonymously`.
4. `/launcher` observes `onAuthStateChanged`; missing auth redirects back to
   `/signin`.
5. Once authenticated, `startApplicationsListener()` subscribes to
   `Applications`, ordered by the legacy `Title` field.
6. Each record is treated as `{ id, Title?, URL?, Icon? }`. Clicking opens
   `URL` in a new tab.

The Firestore rules deny by default, permit an authenticated user to read and
write only `users/{uid}`, and permit any authenticated user to read
`Applications/**`. Application writes are denied.

### Strengths to retain

- The catalogue is read-only to clients.
- Auth state gates Firestore access.
- Local Auth and Firestore emulator wiring exists.
- Environment selection distinguishes local, staging, and production.
- The `Applications` listener is small and easy to adapt.

### Gaps the rebirth must close

- Production is account-first while local testing is anonymous-first, so the
  tested entrance is not the production entrance.
- Firebase config is read without a complete runtime validation step.
- The signed-in user is copied into a second store even though Firebase Auth is
  already the source of truth.
- There is no visible loading, empty, snapshot error, offline, or sign-out
  lifecycle around the catalogue listener.
- Legacy fields are optional at the type boundary and are used without runtime
  validation. Invalid URLs and icons can reach rendering/launch code.
- The external auth component increases coupling for a very small flow.
- The 3D orbit makes semantic navigation and cross-platform pixels harder than
  the underlying product needs.
- E2E auth routing is covered, but the current launcher test surface does not
  prove the complete production library and launch journey.

## Jaipur today

Jaipur is a Svelte 5 client that initializes Firebase once through an async
service boundary. It validates every public Firebase config field, connects to
Auth and Firestore emulators when requested, and then calls
`signInAnonymously(auth)` in every environment.

After auth, the current anonymous UID becomes the actor identity for an
append-only room event stream at `games/{gameId}/events/{eventId}`. Security
rules require auth and require each created event's `actorUid` to match the
Firebase UID. Display names are room-scoped UI data, not authentication. The
repository combines Firestore snapshots, pending local events, and local cache;
tests run against isolated emulators.

### What Jaipur demonstrates well

- Anonymous auth can satisfy secure Firestore rules without blocking play.
- Initialization can be idempotent, explicit, typed, and fully testable.
- The authenticated UID can enforce write ownership even without personal
  identity.
- Emulator settings can be injected by Playwright rather than hidden in app
  code.
- E2E can operate multiple independently authenticated browser contexts.

### What should not be copied

- Jaipur's event-stream repository and public room-read model solve a game,
  not a launcher catalogue.
- Its display-name/localStorage keys are room-specific and are not an account
  migration strategy.
- Signing in anonymously on every initializer call is safe because the Auth SDK
  persists the current session, but Table Top Launcher should still explicitly
  wait for initial auth restoration before deciding to create a new user.

## Authentication comparison

| Concern | LauncherUI | Jaipur | Table Top Launcher decision |
| --- | --- | --- | --- |
| First entrance | Mandatory Google screen | Silent anonymous auth | Silent anonymous auth |
| Local/E2E entrance | Special anonymous button | Same anonymous flow | Same state machine, emulator transport |
| Identity source | Google user copied to store | Firebase anonymous UID | Firebase user is canonical |
| Personal account | Required in production | Not supported | Optional Google link/upgrade |
| Firestore gate | Any authenticated user | Any authenticated user | Existing authenticated read rule |
| User writes | Own `users/{uid}` | Actor-owned game events | Own `users/{uid}` only in v1 |
| Restoration | `onAuthStateChanged` on route | Auth persistence then anonymous sign-in | Resolve initial auth before sign-in |
| Test isolation | Emulator-only button | Emulator env + independent contexts | Emulator-only E2E, no divergent UI |

## Rebirth boundary

The new codebase is not a fork. It will reuse the backend contract and lessons,
not LauncherUI implementation files. This avoids carrying forward stale package
metadata, the external auth wrapper, route-level Firestore access, and WebGL
testing risk. It also keeps licensing and history unambiguous.
