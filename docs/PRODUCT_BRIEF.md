# Product brief

## Product promise

Table Top Launcher turns a table-sized shared touch display into a game shelf
that works from every seat: approach, find a large game icon, and tap it. The
selected game's URL takes over from there.

## Device and user

The only supported device is a permanently installed, landscape 16:9 touch
screen lying flat in a table. People may be standing or seated along any edge or
corner. The launcher is a shared appliance, not a personal app: it has no phone
layout, account management, personal history, or preferred viewing direction.

## Job to be done

1. See that the shared table is ready.
2. Recognize a game from its icon and title from the nearest edge.
3. Spin the eight-slot ring through its tunnel one game at a time, or tap the
   center logo to animate to the next eight-game boundary.
4. Tap one game tile once.
5. Leave the launcher as the target game opens. Everything after launch belongs
   to that game.

## Principles

- **No head of the table.** Geometry, labels, and gestures have no global up.
- **One object, one outcome.** A tile represents one game; tapping it launches.
- **Only honest data.** Render only the Firestore title and icon. The URL is an
  action target, not displayed metadata.
- **Shared and ephemeral.** Silent anonymous Firebase auth satisfies backend
  rules without introducing identity UI.
- **Touch first.** Large separated targets tolerate standing reach, parallax,
  multiple hands, and imperfect taps.
- **Proof from every side.** E2E repeats entry, drag, and launch assertions for
  north, east, south, west, and a corner approach.

## Version-one scope

- Silent anonymous Firebase Auth
- Read-only access to the existing `Applications` collection
- Runtime validation of legacy `Title`, `Icon`, and `URL` fields
- One full-screen radial game carousel with outward-facing titles
- Eight permanently spaced slots over a wrapping alphabetical catalogue
- Fixed tunnel replaces one outgoing game with one incoming game per ring step
- Center-logo tap animates to the next catalogue boundary and wraps
- Direct tap-to-launch with a brief pressed state and safe popup/navigation
- One-finger continuous catalogue browsing with tap-versus-drag disambiguation
- Loading, empty, offline-cache, and error states repeated/oriented for all sides
- Static SvelteKit deployment, Firebase emulators, deterministic E2E, and PR
  previews at the exact table viewport

## Explicit non-goals

- Phone, tablet-handheld, laptop, or conventional desktop layouts
- Sign-in, profile, sign-out, Google linking, or user preferences
- Search, filters, categories, favourites, recents, recommendations, or analytics
- Game details, description, player count, duration, genre, or cover metadata
- Player/setup controls, launch confirmation, or settings of any kind
- Hosting or embedding games; each target URL owns the post-tap experience
- Migrating or enriching the existing catalogue

## Success measures

- Every valid game is reachable and launchable from each table edge.
- The same game can be tapped from north/east/south/west fixtures with identical
  URL and opener-isolation results.
- Tile targets are at least 120 × 120 CSS pixels at the reference 1920 × 1080
  viewport with at least 24 pixels between unrelated active targets.
- A drag never launches, and a tap launches exactly once.
- The surface never document-scrolls, clips a game tile, or privileges a top
  orientation at the installed viewport.
- 100% of critical states have semantic assertions and canonical zero-pixel
  screenshots.
- Automated tests and default previews perform zero production writes.

## Release acceptance

Version one ships only after a read-only comparison proves that it exposes the
same valid `Applications` documents as LauncherUI, the anonymous auth path works
against the existing project, and the full edge/corner E2E matrix passes. The
rollback is a hosting release switch; no database restore is involved.
