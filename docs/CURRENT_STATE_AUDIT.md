# Source audit: LauncherUI and Jaipur

This audit was made from the local sibling repositories `../LauncherUI` and
`../jaipur` on 2026-08-02. It describes observed code and design artifacts, not
an assumed production configuration.

## LauncherUI implementation today

LauncherUI is a client-only SvelteKit 2 / Svelte 4 application using Firebase
Auth and Firestore. Its root layout disables SSR and prerenders the static
client.

The startup path is:

1. `/` redirects to `/signin` after mount.
2. Production and staging render `@ourway/svelte-firebase-auth` with a
   `GoogleAuthProvider`.
3. Local mode exposes a bespoke “Continue with Emulator” action that calls
   `signInAnonymously`.
4. `/launcher` observes `onAuthStateChanged`; missing auth redirects to sign-in.
5. Once authenticated, `startApplicationsListener()` subscribes to
   `Applications`, ordered by legacy `Title`.
6. Each record is treated as `{ id, Title?, URL?, Icon? }`. Activating a game
   opens `URL` in a new tab.

The rules deny by default, permit an owner to access `users/{uid}`, and permit
any authenticated user to read `Applications/**`. Catalogue writes are denied.

### Implementation strengths to retain

- The catalogue is authenticated and read-only to browser clients.
- Local Auth and Firestore emulator wiring exists.
- Environment selection distinguishes local, staging, and production.
- The catalogue contract is exactly the small launcher contract we need.

### Implementation gaps to close

- Production and E2E enter through different authentication experiences.
- Firebase config lacks a complete runtime validation boundary.
- Legacy fields are optional and reach rendering/launch without validation.
- Loading, empty, snapshot-error, offline, and invalid-URL states are incomplete.
- Essential interaction is implemented in a Three.js scene, complicating
  semantic hit targets, multi-touch arbitration, and deterministic pixels.
- The current app presents a global top-left header, so the implementation does
  not yet fulfill the no-head-of-table concept in its earlier mockups.

## LauncherUI design artifacts

The earlier mockups in `../LauncherUI/docs/images/` establish the correct device
context even where their feature scope is too broad:

- `launcher_home_screen.png` shows a touch display physically embedded in a
  dining/game table, with controls distributed around its perimeter.
- `launcher_orbit_selection.png` treats games as large tactile objects in a
  circular selection system that can be spun.
- `launcher_library_grid.png` shows generous icon-led targets intended for touch.
- `launcher_game_details.png` and `game_session_overlay.png` extend beyond the
  launcher's actual data and responsibility and are explicitly rejected here.

The rebirth keeps the shared-table, orbital/radial, tactile, and perimeter ideas.
It removes category suns, metadata filters, details, setup, configuration, and
any control with a fixed viewer orientation. Commercial game imagery in the old
concepts is also replaced by neutral fixtures in design and tests.

## Jaipur authentication today

Jaipur is a Svelte 5 client that initializes Firebase once through an async
service boundary. It validates every public Firebase config field, connects to
Auth and Firestore emulators when requested, and calls `signInAnonymously(auth)`
in every environment.

The current anonymous UID becomes actor identity for an append-only room event
stream. Rules require authentication and ensure each created event's `actorUid`
matches the token UID. Display names are game data, not authentication. Tests
use isolated emulators and independent browser contexts.

### What Jaipur demonstrates well

- Anonymous auth satisfies secure Firestore rules without an account screen.
- Initialization is idempotent, explicit, typed, and testable.
- Emulator settings are injected by Playwright rather than hidden behind a
  different user-facing route.
- Multiple independent touch/user contexts can be tested without personal data.

### What should not be copied

- Jaipur's room/event repository solves a game, not the launcher's read-only
  catalogue.
- Its display-name and local game storage have no role on the shared appliance.
- The launcher should explicitly await initial auth restoration before creating
  a session, even though Firebase persists anonymous sessions.

## Authentication comparison and decision

| Concern | LauncherUI | Jaipur | Table Top Launcher |
| --- | --- | --- | --- |
| First entrance | Mandatory Google screen | Silent anonymous auth | Silent anonymous auth |
| Local/E2E entrance | Special anonymous action | Same flow as production | Same state machine, emulator transport |
| Identity source | Google user copied to store | Firebase anonymous UID | Firebase user is internal only |
| Account UI | Required | None | None |
| Firestore gate | Any authenticated user | Any authenticated user | Existing authenticated read rule |
| Writes | Own user document | Actor-owned events | No client data writes in v1 |
| Restoration | Route observer | Persistence + anonymous sign-in | Await observer, create only if absent |

## Rebirth boundary

The new codebase is not a fork. It reuses the backend contract and tabletop
design lessons, not LauncherUI implementation files. This avoids carrying
forward the auth wrapper, global header, route-level Firestore access, WebGL hit
testing, and out-of-scope detail/setup concepts while keeping database and
hosting rollback straightforward.
