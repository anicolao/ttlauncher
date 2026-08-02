# Implementation plan

Each increment is a reviewable PR with a runnable outcome. Later increments may
refine details through ADRs, but they may not silently violate the auth, data,
accessibility, or E2E contracts in this design package.

## Increment 0 — design foundation (this PR)

Deliver product, source audit, architecture, auth, data, UX, preview, E2E, and
rollout documents; high-fidelity reference mockups; validation; and a PR-specific
design preview.

Exit criteria:

- all internal document/image links validate;
- generated mockups are committed and visibly marked as references;
- GPLv3 is detected on the repository;
- the draft PR and preview URL are available for review.

## Increment 1 — application skeleton

- Scaffold SvelteKit/Svelte 5/TypeScript strict with static adapter.
- Pin Node, package manager, dependency lockfile, formatter, and static checks.
- Add app shell, tokens, bundled fonts or approved system stack, error boundary,
  fixture data mode, and nested-base-path handling.
- Establish unit/component test harness and the design-preview replacement with
  a production build preview.

Exit criteria: fixture library shell builds at a nested PR path; keyboard, phone,
empty, and error shells are tested; no Firebase dependency is used by components.

## Increment 2 — Firebase gateway and anonymous session

- Validate public config, initialize exactly once, and connect emulators only
  from explicit environment settings.
- Implement the auth session state machine and silent anonymous entrance.
- Add deny-by-default rules plus exhaustive owner/catalogue emulator tests.
- Add E2E scenario 002 with real Auth emulator sessions.

Exit criteria: first visit and reload work without auth UI; distinct contexts
have distinct UIDs; production is impossible in tests; failure states recover.

Operational prerequisite: enable anonymous Auth in the existing Firebase project
before any live-read or production deployment.

## Increment 3 — legacy catalogue compatibility

- Implement `Applications` gateway and runtime adapter for `Title`, `URL`, and
  `Icon`.
- Add IndexedDB catalogue cache and current/stale/offline/error states.
- Add deterministic emulator seeding and E2E scenarios 001 and 003.
- Run a read-only production audit and compare IDs/order with LauncherUI.

Exit criteria: same valid catalogue set/order, invalid records fail safely,
cache freshness is honest, and no catalogue write path exists in the client.

## Increment 4 — library UI and navigation

- Implement responsive library, search, honest available filters, image fallback,
  details route, status, and focus/scroll restoration.
- Add component accessibility tests and E2E scenarios 004 and 008.
- Enforce performance budgets and no-scroll desktop acceptance.

Exit criteria: complete keyboard/phone/200%-zoom journeys, zero-pixel canonical
baselines, and an inspected responsive preview.

## Increment 5 — safe launch and recents

- Implement URL validation, opener isolation, popup-block fallback, and recent
  activity only after trusted activation.
- Persist bounded `users/{uid}` preferences through the gateway.
- Tighten rules field/type/size constraints and implement E2E scenario 005.

Exit criteria: malicious/invalid targets cannot launch, catalogue remains
read-only, cross-user writes fail, and recent state survives reload.

## Increment 6 — favourites and optional account upgrade

- Implement favourites and profile surface.
- Implement Google link, cancellation, collision confirmation/merge, and guest
  reset semantics.
- Add unit/rules coverage for merge boundaries and E2E scenario 006.

Exit criteria: guest use remains the default, link preserves UID when possible,
collision does not lose data, and cancel never disrupts play.

## Increment 7 — resilience and release candidate

- Complete offline/reconnect/permission failure scenario 007.
- Run performance, accessibility, privacy, and security review.
- Configure protected production build/deploy workflow and build provenance.
- Run same-database parallel-read comparison and document rollback rehearsal.

Exit criteria: all verification commands pass, live-read preview is approved,
hosting rollback is proven, and no open severity-high finding remains.

## Initial issue map

| Workstream | Depends on | Can proceed alongside |
| --- | --- | --- |
| App shell/design system | Design foundation | Test harness |
| Test helper/emulator harness | Skeleton | Visual components |
| Firebase/auth gateway | Skeleton | Catalogue adapter fixtures |
| Legacy catalogue adapter | Gateway types | Library components with fixtures |
| Library/details UI | Shell + domain model | Cache implementation |
| Launch/preferences | Catalogue + auth | Account upgrade UX |
| Release workflow | Passing app build | Resilience scenarios |

## Definition of done for every implementation PR

- User-visible behavior and failure states are complete.
- Domain/unit, rules, component, and E2E coverage is proportionate to risk.
- Canonical screenshots and generated walkthroughs are reviewed and committed.
- PR preview works at its nested URL and states its data mode.
- Static checks, tests, build, diff checks, and design-package validation pass.
- No skipped/focused test, relaxed visual threshold, arbitrary sleep, production
  test access, or unvalidated external URL is introduced.
- Relevant ADR/design documents and rollback notes are current.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Anonymous provider disabled | Explicit production prerequisite and configuration error |
| Legacy malformed records | Runtime adapter, diagnostics, safe exclusion/fallback |
| Google credential collision | Confirmed deterministic merge with emulator tests |
| Preview writes to production | Fixture default; live-read disables preferences |
| Pixel drift | DOM/CSS surfaces, pinned Linux stack, bundled assets, zero tolerance |
| Generated mockups over-promise data | Label as reference; render only real metadata |
| Rollback requires data restore | No catalogue migration; versioned additive preferences |
