# End-to-end testing guide

Playwright E2E tests are executable specifications for a table-sized horizontal
touch appliance. A passing journey proves anonymous auth, legacy catalogue data,
radial geometry, touch arbitration, orientation, and safe one-tap launch against
isolated Firebase emulators.

## Non-negotiable contract

1. E2E never connects to production or preview Firebase projects.
2. Tests use the real silent anonymous flow; no test-only sign-in UI exists.
3. The canonical viewport is the installed table ratio and reference size:
   1920 × 1080 CSS pixels, device scale factor 1.
4. Canonical Linux screenshots use `maxDiffPixels: 0`, pinned Chromium, bundled
   fonts/icons, and a versioned fixture.
5. Tests are not skipped, quarantined, order-dependent, or retried.
6. Arbitrary sleeps (`waitForTimeout`, shell `sleep`) are forbidden.
7. Every screenshot uses `TestStepHelper`; tests never choose counters or paths.
8. North, east, south, west, and corner touch approaches are required evidence.
9. Phone or conventional responsive-browser projects must not be added.

## Test layers

- **Unit:** legacy record parsing, URL policy, alphabetical ordering, radial
  coordinates/orientation bands, angle wrapping, and tap-versus-drag reducer.
- **Component:** semantic tile names, pointer capture/cancel, pressed state,
  repeated edge status, and exact launch command count.
- **Rules:** authenticated `Applications` reads plus unauthenticated and all-write
  denial.
- **E2E:** anonymous session, emulator catalogue, radial layout, multi-edge touch,
  drag browsing, direct launch, offline/error states, and multi-touch safety.

## Repository layout

```text
tests/e2e/
  helpers/
    test-step-helper.ts
  tabletop-launcher.spec.ts
  screenshots/chromium-linux/
    tabletop-launcher.spec.ts/*.png
  ../fixtures/applications.mjs
```

The current vertical slice has four coherent journeys: fixed-table geometry,
center paging and wrap, direct launch from four edges plus a corner, and
drag-without-launch. The scenario inventory below defines the remaining
hardening work. There is no phone project and no game-details journey.

## Unified step pattern

```ts
const steps = new TestStepHelper(page, testInfo);

await page.goto('/');
await expect(page.locator('[data-status]')).toHaveAttribute('data-status', 'current');

await steps.step('east-ready', {
  screenshot: 'page-one.png',
  verifications: [
    () => expect(page.getByRole('button', { name: 'Launch Caravan' })).toBeVisible()
  ]
});
```

`step()` must:

1. run semantic verifications;
2. require stable `data-status="current"`;
3. wait for bundled fonts and fixture icons to finish decoding;
4. assert exactly 1920 × 1080 layout with no document scroll or overflow;
5. assert every tile meets the target and viewport constraints;
6. assert tiles do not overlap the center or four handles;
7. take an optional viewport screenshot with animations disabled; and
8. attach machine-readable step evidence to the Playwright result.

## Deterministic environment

| Input | E2E value |
| --- | --- |
| Browser / OS | Pinned Playwright Chromium in versioned Linux container |
| Viewport | 1920 × 1080 only; targeted smaller table resolution is a separate project |
| DPR | 1 |
| Locale / timezone | `en-CA` / `America/Toronto` |
| Clock | Fixed per test and explicitly advanced |
| Motion | Reduced at capture; inertia controlled by a test clock |
| Fonts | Bundled WOFF2; wait for `document.fonts.ready` |
| Icons | Local fictional fixture icons with explicit dimensions |
| Service workers | Blocked unless an offline-cache scenario owns them |
| Backend | Auth + Firestore emulators on fixed ports |
| Identity | Real emulator anonymous user |
| Catalogue | Versioned `Applications` seed using only Title/Icon/URL |
| Network | Online unless a test explicitly toggles it |

The primary surface is DOM/CSS, so screenshots do not depend on WebGL. Remote
production icons are never requested in E2E.

## Emulator lifecycle

The Playwright web server runs inside one
`firebase emulators:exec --project ttlauncher-e2e --only auth,firestore` process:

1. start emulators on pinned ports;
2. clear state;
3. seed a deterministic `Applications` fixture;
4. start the production-like server with explicit emulator variables;
5. run with one worker until isolation and fixed ports are redesigned; and
6. tear down the whole process.

Tests that alter the catalogue do so through the emulator admin helper before a
page subscribes. No test depends on order or an emulator left running locally.

## Coordinate model for edge approaches

Touch helpers use normalized table coordinates and an explicit approach label:

```ts
type Approach = 'north' | 'east' | 'south' | 'west' | 'north-east-corner';

const approachPoints = {
  north: { x: 0.5, y: 0.04 },
  east: { x: 0.96, y: 0.5 },
  south: { x: 0.5, y: 0.96 },
  west: { x: 0.04, y: 0.5 },
  'north-east-corner': { x: 0.93, y: 0.07 }
};
```

The helper converts normalized positions through the real surface bounding box
and uses CDP/Playwright touchscreen events with stable pointer IDs. Do not call
component functions or mutate ring state from tests.

## Omnidirectional geometry assertions

For each visible tile, E2E reads its DOM rectangle and exposed normalized
rotation value (for example `data-angle`, not a test-only layout override).
Assertions prove:

- center point lies within the ring band;
- all four edge zones contain readable/reachable tiles;
- labels face outward or match the approved four-band orientation;
- target width/height are at least 120 pixels;
- unrelated active rectangles are separated by at least 24 pixels;
- all active rectangles remain inside the installed viewport; and
- the center page button and four handles do not overlap launch tiles.

Screenshots then review the relationship as a whole.

## Tap versus drag

Every pointer path asserts command count, not just final URL:

| Gesture | Expected result |
| --- | --- |
| Down/up inside one tile below threshold | Exactly one launch command |
| Down, cross one 45° step, up over same tile | Adjacent page loads; zero launches |
| Down on tile, release outside below/at cancellation rule | Zero launches |
| Down then `pointercancel` | State resets; zero launches |
| Drag handle/empty track | Pages browse in drag direction and wrap; zero launches |
| Tap center with overflow catalogue | Next page of eight; zero launches |
| Tap center on final page | Wrap to page one; zero launches |
| Tap inert center with ≤8 games | No state change; zero launches |
| Two near-simultaneous taps | At most the explicitly selected first launch |
| Tap while ring is settling | Defined safe behavior; never duplicate launch |

Threshold tests include just-below and just-above distances. The implementation
uses CSS pixels mapped from a documented physical target-hardware threshold.

## Direct launch testing

There is no details/setup intermediate surface. A tile tap must emit a popup or
navigation immediately:

```ts
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  tapTileFrom(page, 'Caravan', 'east')
]);

await expect(popup).toHaveURL('https://games.example.test/caravan');
expect(await popup.evaluate(() => window.opener)).toBeNull();
expect(await page.getByRole('dialog').count()).toBe(0);
```

Repeat this contract for north, east, south, west, and one corner, rotating the
ring as needed to bring the same fixture game near that approach. Also test an
invalid scheme, popup-blocked/error feedback, and exactly-once dispatch.

## Scenario inventory

| ID | Journey | Required evidence |
| --- | --- | --- |
| 001 | Tabletop shell | full-screen no-top layout, loading/current, no scroll |
| 002 | Anonymous auth | invisible first session, reload restore, auth failure perimeter |
| 003 | Catalogue/paging | legacy parsing/order, fallback icon, pages of 8, tap/spin paging, bidirectional wrap |
| 004 | Omnidirectional launch | same fixture from N/E/S/W/corner, immediate safe URL |
| 005 | Swipe/arbitration | handles, empty track, tile drag, thresholds, cancel, settle |
| 006 | Resilience | cached offline ring, reconnect, empty, permission/error retry |
| 007 | Multi-touch/a11y | simultaneous pointers, reduced motion, forced colours, service keyboard |

## Visual baseline policy

- Linux CI is the only visual source of truth.
- Use viewport screenshots; `fullPage` is forbidden because it can conceal
  accidental document overflow on the fixed table.
- Store baseline states at ring angle 0 and one deterministic rotated angle.
- Capture error/empty states with all four perimeter copies visible.
- Masking broad regions, loosening tolerances, retries, or platform-specific
  thresholds is forbidden.
- A baseline update requires inspecting before/after images and describing the
  intended tabletop relationship in the PR.

## Physical-device acceptance

Playwright cannot prove reach, glare, or parallax. Before release, run the E2E
fixture build on the real table and record a short manual checklist:

- seated and standing launch from all four sides;
- one corner approach;
- drag with a sleeve/palm resting near another edge;
- two people touching different areas;
- title legibility under room lighting;
- target reach without leaning across the center; and
- target game takes over cleanly after launch.

This report is release evidence, not a substitute for automated tests.

## Commands

```sh
npm run test:unit
npm run test:rules
npm run test:e2e
npm run test:e2e:update-snapshots
npm run verify:change
```

`verify:change` runs design validation, static checks, unit/rules/E2E tests,
production build, `git diff --check`, and guards against skipped/focused tests,
arbitrary waits, phone projects, and relaxed screenshot settings. Hooks are
never bypassed.

## Failure triage

1. Read the first semantic or geometry failure before the image diff.
2. Inspect trace, screenshot, pointer log, console, and emulator log.
3. Reproduce in the pinned 1920 × 1080 environment.
4. Fix state, geometry, fixture, or an unpinned rendering input.
5. If the visual change is intended, update once in the canonical environment,
   inspect all four approach zones, and describe it in the PR.
