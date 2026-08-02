# Architecture

## Technology baseline

- SvelteKit 2 with Svelte 5 and TypeScript strict mode
- Static adapter; client-side Firebase Auth and Firestore
- Firebase modular SDK with Auth/Firestore emulators
- Semantic HTML game buttons positioned with CSS transforms
- Pointer Events for touch arbitration; no required canvas/WebGL hit layer
- Vitest for pure modules/components, Firebase Rules Unit Testing for rules, and
  Playwright for touch journeys and canonical visual baselines
- npm with committed lockfile and pinned CI Node version

## Runtime boundaries

```text
radial tabletop surface
        │ GameTile view models + pointer commands
        ▼
launcher state ─────── auth / catalogue / ring angle / connection / launch
        │
        ▼
domain adapters ───── validate legacy records, URL policy, radial geometry
        │
        ▼
Firebase gateway ──── anonymous Auth + read-only Applications subscription
        │
        ▼
existing LauncherUI Firebase project
```

Only the gateway imports Firebase. Only the catalogue adapter knows
`Applications`, `Title`, `URL`, and `Icon`. Only the launch policy may turn a
validated URL into navigation.

## Implemented source layout

```text
src/
  lib/
    data/               # fixture and Firebase catalogue sources
    domain/             # GameTile parsing, paging, and ring geometry
  routes/
    +layout.ts          # static application boundary
    +page.svelte       # the only product surface and pointer controller
tests/
  rules/
  e2e/
```

There is no detail, profile, settings, or sign-in route.

## State model

- `session`: booting, ready, error
- `catalogue`: idle, loading, current, stale-cache, empty, error
- `ring`: page index, angle, drag-idle/dragging/settling
- `connectivity`: online, offline, reconnecting
- `launch`: idle, pressed, opening, blocked

Game data never gains presentation-only metadata. Radial position and rotation
are derived from sorted tile index, ring angle, tile count, and viewport.

## Omnidirectional geometry

The installed display uses a 1920 × 1080 reference coordinate space scaled as
one unit. The ring is centered at `(960, 540)`. Every tile sits at angle `θ` and
is rotated so its baseline faces outward:

```text
x = centerX + radiusX × cos(θ)
y = centerY + radiusY × sin(θ)
rotation = 90° - θ
```

Because the display is rectangular, `radiusX` and `radiusY` form an ellipse in
screen space while preserving perceptual reach. Tile orientation may snap into
four edge bands if continuous radial text harms legibility; that decision is
validated with physical-device tests, not assumed from a desktop monitor.

The center logo is a paging button only when `ceil(gameCount / 8) > 1`.
Activating it advances `(pageIndex + 1) % pageCount`, resets the presentation
angle to its deterministic page-entry value, and never launches a URL. Four
outward-facing page counters surround it. Equivalent drag handles appear at
north, east, south, and west. There is no global header or top-origin panel.

## Pointer arbitration

Use Pointer Events and pointer capture.

1. `pointerdown` records pointer ID, start coordinate, target tile if any, time,
   and current ring angle.
2. Movement below an implementation-tuned physical threshold retains tap intent.
3. Movement beyond threshold cancels tap intent and rotates the ring; velocity
   may produce restrained inertial settling.
4. `pointerup` on the same valid tile with tap intent launches exactly once.
5. A second pointer must not cause duplicate launch. The simplest v1 policy is
   to lock ring movement to the first active pointer while allowing independent
   stationary tile taps only after explicit multi-touch tests.
6. `pointercancel` always clears pressed/drag state and never launches.

Reduced motion removes inertial settling; direct drag remains available.

## Catalogue and launch flow

1. App restores or creates anonymous auth silently.
2. Gateway may expose a compatible cached catalogue, marked stale/offline.
3. Gateway subscribes to ordered `Applications`.
4. Adapter emits valid `GameTile` values and bounded diagnostics.
5. The catalogue is split into stable pages of eight; geometry lays the current
   page around the ring.
6. Swiping repositions only the current page; center activation loads the next.
7. A stationary tile tap revalidates its `https:` URL and opens it with
   `noopener,noreferrer`.
8. The target game owns every subsequent screen and interaction.

There is no intermediate route, modal, confirmation, setup, or launch button.
The pressed outline is transient touch feedback, not a second step.

## Rendering decision

The orbit is expressed in DOM/CSS rather than Threlte. Each tile remains a real
button/link with an accessible name and testable rectangle while transforms
provide the tactile radial presentation. Decorative canvas is allowed later
only behind the semantic surface and cannot own hit testing.

## Failure surfaces

Loading, offline, empty, and error messages repeat at four perimeter anchors,
rotated to face the adjacent edge. Only one semantic live region announces the
state to avoid duplicate assistive output. Retry controls are duplicated
visually but dispatch the same idempotent command.

## Performance budgets

- Reference render: stable 60 fps during one-finger ring drag on target hardware.
- Pointer-to-pressed feedback: under 50 ms.
- Initial JS: 180 KiB gzip excluding lazy Firebase; startup total 350 KiB gzip.
- No WebGL scene, unbounded icon preload, or remote font dependency.
- Icons have fixed dimensions and lazy decode outside the visible range.

## Deployment shape

- Production: static client configured for the existing Firebase project.
- PR preview: fixture catalogue, exact table viewport, no backend by default.
- Live-read acceptance: authenticated read of the existing project, no writes.
- E2E: local production build plus isolated Auth and Firestore emulators.

Mode is explicit at build time; hostname inference is forbidden.
