# Architecture

## Technology baseline

- SvelteKit 2 with Svelte 5 and TypeScript strict mode
- Static adapter; client-side Firebase Auth and Firestore
- Firebase modular web SDK with Auth/Firestore emulators
- Semantic HTML and CSS custom properties; no required canvas/WebGL layer
- Vitest for pure modules/components, Firebase Rules Unit Testing for rules,
  and Playwright for user journeys and visual baselines
- npm with a committed lockfile and pinned CI Node version

Exact package versions are selected in the scaffold PR, then updated by normal
dependency PRs. The architecture does not depend on importing code from either
source repository.

## Runtime boundaries

```text
Svelte routes/components
        │ typed view models and commands
        ▼
application stores ─── auth session / catalogue / preferences / connectivity
        │
        ▼
domain adapters ────── validate legacy records, URLs, and preference schemas
        │
        ▼
Firebase gateway ───── Auth + Firestore SDK, emulator wiring, subscriptions
        │
        ▼
existing LauncherUI Firebase project
```

Only the gateway imports Firebase SDK modules. Only the catalogue adapter knows
the legacy names `Applications`, `Title`, `URL`, and `Icon`. This makes the
same-database promise testable and stops legacy casing from spreading through
the UI.

## Proposed source layout

```text
src/
  lib/
    application/       # state orchestration and commands
    domain/            # GameSummary, parsers, filtering, launch policy
    firebase/          # config, auth session, catalogue/preferences gateways
    components/        # semantic presentational components
    styles/            # tokens, reset, focus, responsive layout
  routes/
    +layout.svelte     # one app-lifetime session and connectivity boundary
    +page.svelte       # library
    games/[id]/        # details and setup
    profile/           # account upgrade and preferences
tests/
  unit/
  rules/
  e2e/
```

The game detail route is deep-linkable. The static build supplies fallback
rewrites so direct navigation works on hosting.

## Application state

Independent state machines avoid a single boolean “loading” state:

- `session`: booting, ready-anonymous, ready-identified, error
- `catalogue`: idle, loading, current, stale-cache, empty, error
- `preferences`: loading, ready, saving, error
- `connectivity`: online, offline, reconnecting
- `launch`: idle, validating, opening, blocked

Derived view models join catalogue and preferences. Firestore snapshots remain
immutable inputs; UI filters do not mutate gateway data.

## Catalogue flow

1. Root starts and restores/creates an authenticated session.
2. Catalogue gateway may expose a version-compatible cached snapshot.
3. Gateway subscribes to the existing ordered `Applications` query.
4. Adapter validates every document and emits valid games plus diagnostics.
5. Store reconciles favourites/recent IDs, tolerating removed games.
6. UI renders current, stale, empty, or actionable error state.
7. Unsubscribe occurs exactly once at app teardown or session replacement.

## Launch flow and safety

A game card is a normal link when its target has passed validation. The launch
command revalidates the URL at activation and uses a new browsing context with
`noopener,noreferrer`; it never injects catalogue strings as HTML. Invalid
records show a disabled launch state with a useful, non-sensitive explanation.

Record recent activity only after a trusted click/key activation and successful
opening attempt. Popup blocking produces a copy/open fallback and does not claim
success.

## Rendering strategy

The primary UI is DOM/CSS. This is a deliberate change from LauncherUI's
Threlte orbit:

- semantic controls and browser focus behavior work without parallel overlays;
- layout responds predictably at zoom and narrow widths;
- canonical visual snapshots do not depend on a GPU/WebGL implementation;
- reduced motion can remove decorative transitions without changing structure;
- the library scales beyond a small number of orbiting nodes.

Motion is limited to transform/opacity transitions under 250 ms. Tests and
`prefers-reduced-motion` disable it. View transitions are progressive
enhancement only.

## Resilience and observability

- User-visible states expose stable `data-status` values for testing and support.
- Errors map Firebase codes to bounded product messages; raw tokens, document
  contents, and credentials never enter logs.
- A build identifier and environment label are available in the profile/support
  panel, not permanently cluttering the launcher.
- Catalogue diagnostics report counts and document IDs only in development or
  authorized administration contexts.

## Performance budgets

- Initial JS target: 180 KiB gzip excluding the lazy-loaded Firebase chunk;
  total startup JS target: 350 KiB gzip.
- No third-party font request; subset/bundle WOFF2 assets.
- Responsive catalogue images with dimensions, lazy loading below the fold, and
  a stable aspect ratio.
- No library-wide WebGL scene or unbounded image preloading.
- Performance acceptance is measured on the production build, not the Vite dev
  server.

## Deployment shape

- Production: static assets on the existing Firebase Hosting site or an
  explicitly approved replacement, configured to the existing Firebase project.
- PR preview: the design-only PR uses GitHub Pages; application PRs use the same
  URL contract and fixture data by default.
- E2E: local server plus isolated Auth and Firestore emulators.

Preview, test, and production data modes are explicit compile-time settings;
hostname guessing is forbidden.
