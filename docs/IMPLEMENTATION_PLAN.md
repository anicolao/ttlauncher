# Implementation plan

Each increment is a reviewable PR with a runnable tabletop outcome. No increment
may add personal-device UI, game metadata beyond title/icon/URL, or an
intermediate post-tap launcher flow.

## Increment 0 — design foundation and runnable slice (this PR)

Deliver the source/auth audit and design package, then prove the central choices
with a runnable SvelteKit slice: fixture and Firebase catalogue sources, silent
anonymous auth, a wrapping eight-slot tunnel carousel, animated boundary paging,
ring drag, direct safe launch, emulator rules tests, and a build-based PR preview.

Exit criteria:

- no phone, details, setup, profile, preferences, or metadata concept remains;
- both tabletop mockups and internal links validate;
- GPLv3 is detected;
- preview URL is interactive and checks pass;
- unit, rules, and four executable Playwright journeys pass;
- Linux visual baselines cover the initial and rotated ring.

## Increment 1 — fixed tabletop shell (delivered in increment 0)

- Scaffold SvelteKit/Svelte 5/TypeScript strict with static adapter.
- Pin Node, package manager, lockfile, formatting, and checks.
- Add the 1920 × 1080 full-screen surface, tokens, center paging zone, four edge
  status anchors, and fixture data mode.
- Establish unit/component harness and build-based PR preview.

Exit criteria: fixture surface builds at nested PR path, never document-scrolls,
has no privileged header/top, and exposes loading/empty/error from all sides.

## Increment 2 — Firebase gateway and silent auth (delivered in increment 0)

- Validate public config and initialize services exactly once.
- Connect emulators only through explicit environment configuration.
- Implement restored-or-new anonymous session with no UI.
- Preserve deny-by-default rules and test authenticated catalogue read plus all
  writes denied.
- Add E2E scenario 002.

Exit criteria: boot/reload work without sign-in controls; production is impossible
in tests; auth failures render equivalent perimeter recovery.

Operational prerequisite: enable anonymous Auth in the existing Firebase project.

## Increment 3 — legacy catalogue adapter (adapter delivered; cache/audit remain)

- Implement read-only `Applications` gateway and runtime parser for `Title`,
  `Icon`, and `URL` only.
- Add deterministic local icons, emulator seeding, and versioned IndexedDB cache.
- Add current/offline/invalid-record behavior and E2E scenario 003.
- Run a read-only production audit against LauncherUI results.

Exit criteria: same valid catalogue IDs/order, safe invalid URL handling, honest
offline cache, and no Firestore write path.

## Increment 4 — radial game ring (delivered in increment 0)

- Implement ellipse/ring geometry and outward/four-band title orientation.
- Render large semantic tile controls, conditional center page button, four
  edge handles, and four outward-facing page counters.
- Render an eight-slot wrapping window over the alphabetical catalogue; replace
  one token under the fixed tunnel per 45° step and animate center taps to the
  next original-catalogue boundary.
- Add geometry/unit/component coverage and E2E scenario 001.

Exit criteria: target/gap/viewport invariants pass; north/east/south/west/corner
zones are equivalent; canonical zero-pixel baselines are approved.

## Increment 5 — touch hardening

- Extend the delivered Pointer Events/capture/continuous-page drag with explicit
  release-outside, pointer-cancel, threshold-boundary, and multi-pointer coverage.
- Define physical tap/drag threshold and reduced-motion behavior.
- Add just-below/above threshold, tile-origin drag, handle, empty-track, settle,
  pointer-cancel, and multi-pointer tests in scenarios 005 and 007.

Exit criteria: every drag path produces zero launches, no pointer state sticks,
and target hardware maintains stable 60 fps.

## Increment 6 — direct safe launch hardening

- Retain the delivered HTTPS revalidation and opener-isolated direct launch.
- Add pressed state under 50 ms and bounded blocked-launch feedback.
- Add north/east/south/west/corner journey matrix in scenario 004.

Exit criteria: the same fixture launches from every approach; tap emits exactly
one command; no details/modal/setup/confirmation route exists.

## Increment 7 — resilience and release candidate

- Complete offline/reconnect/empty/permission/error scenario 006.
- Run performance, forced-colours, reduced-motion, and physical-table review.
- Configure protected production deployment and build provenance.
- Run same-database comparison and rehearse Hosting rollback.

Exit criteria: all verification passes, live-read preview is approved, the
physical four-side checklist is recorded, and rollback is proven.

## Workstream map

| Workstream | Depends on | Can proceed alongside |
| --- | --- | --- |
| Fixed shell/design tokens | Design foundation | Test helper |
| Emulator/E2E harness | Skeleton | Fixture radial component |
| Firebase/auth gateway | Skeleton | Geometry unit work |
| Catalogue adapter/cache | Gateway types | Radial UI with fixtures |
| Pointer state machine | Radial geometry | URL policy |
| Direct launch | Catalogue + pointer intent | Resilience states |
| Release workflow | Passing build | Physical-device testing |

## Definition of done for every implementation PR

- Only title/icon/URL data and approved system status are visible.
- North/east/south/west/corner effects are explicitly reviewed.
- Unit, rules, component, and E2E coverage is proportionate to risk.
- Canonical screenshots and walkthroughs are inspected and committed.
- PR preview works at the fixed table viewport and declares its data mode.
- Static checks, tests, build, diff check, and package validation pass.
- No skipped test, relaxed screenshot, arbitrary sleep, production test access,
  phone project, Firestore write, or intermediate launcher flow is introduced.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A conventional “top” leaks into UI | Geometry assertions and four-side screenshots |
| Tap becomes drag or duplicate launch | Pointer reducer plus threshold/exactly-once matrix |
| Too many games shrink targets | Fixed eight-slot window; one-for-one tunnel replacement; modular catalogue wrap |
| Rotated titles are hard to read | Physical test continuous radial vs four-band snapping |
| Multi-touch corrupts ring state | Pointer capture policy and simultaneous-hand tests |
| Legacy malformed record | Runtime parser, safe omission/fallback |
| Anonymous provider disabled | Explicit production prerequisite |
| Preview touches production | Fixture default; protected live-read; no write code |
| Rollback needs data restore | No ttlauncher data writes or migration |
