# End-to-end testing guide

Playwright E2E tests are executable product specifications. A passing journey
must prove behavior, layout, and its review evidence against isolated Firebase
emulators. Visual assertions support semantic assertions; they never replace
them.

## Non-negotiable contract

1. E2E never connects to production or preview Firebase projects.
2. Tests use the real anonymous-first UI flow. There is no test-only sign-in
   button, route, or bypass.
3. Canonical Linux screenshots use `maxDiffPixels: 0`, device scale factor 1,
   bundled assets, and a pinned Chromium/container version.
4. Tests are not skipped, quarantined, made order-dependent, or retried.
5. Arbitrary sleeps (`waitForTimeout`, shell `sleep`) are forbidden.
6. Every screenshot step uses the shared `TestStepHelper`; test code never
   chooses counters or screenshot paths manually.
7. A feature is incomplete until its error, empty, keyboard, and narrow-screen
   states are covered in proportion to risk.

## Test layers

- **Unit:** legacy record parsing, URL policy, filters, preference merge, state
  reducers, time formatting, and config validation.
- **Component:** semantic names, keyboard behavior, focus, and error rendering
  for isolated components.
- **Rules:** authenticated catalogue read, denied catalogue write,
  owner-only preferences, schema limits, and cross-user denial.
- **E2E:** user-visible integration across Svelte, Firebase Auth/Firestore
  emulators, routing, responsive layout, caching, and external launch intent.

Do not use E2E to exhaustively permute pure filtering logic. Do use it to prove
that the actual controls and Firestore data join correctly.

## Planned repository layout

```text
tests/e2e/
  helpers/
    test-step-helper.ts
    emulator-admin.ts
    fixtures.ts
  001-app-shell/
    001-app-shell.spec.ts
    README.md
    screenshots/chromium-linux/*.png
  002-anonymous-auth/
  003-library-data/
  004-find-and-inspect/
  005-launch-game/
  006-preferences-and-upgrade/
  007-offline-and-errors/
  008-responsive-accessibility/
```

One numbered directory owns one coherent journey, its generated walkthrough,
and its baselines. Do not create a catch-all spec.

## Unified step pattern

The shared helper makes verification, layout checks, screenshot capture, and
walkthrough generation atomic:

```ts
const steps = new TestStepHelper(page, testInfo);
steps.setMetadata(
  'Guest opens the library',
  'A first-time player can reach the catalogue without an account prompt.'
);

await page.goto('/');
await steps.step('library-ready', {
  description: 'The authenticated guest sees the seeded catalogue',
  status: 'current',
  verifications: [
    {
      spec: 'Library heading is exposed',
      check: () => expect(page.getByRole('heading', { name: 'Your games' })).toBeVisible()
    },
    {
      spec: 'Seeded games are links in title order',
      check: () => expect(page.getByTestId('game-title')).toHaveText(['Caravan', 'Mosaic'])
    }
  ]
});

steps.generateDocs();
```

`step()` must:

1. run semantic verifications;
2. require the expected stable `data-status`;
3. move the pointer away and hide the caret;
4. assert no unintended document scroll/overflow for no-scroll viewports;
5. assert visible controls do not overlap or leave the viewport;
6. run optional automated accessibility checks;
7. take the canonical screenshot with animations disabled; and
8. append the exact assertions and relative image to `README.md`.

Walkthrough files are generated on the canonical platform only. CI fails if a
test changes the generated file or screenshot without committing the result.

## Deterministic environment

Pin all inputs that can change pixels or behavior:

| Input | E2E value |
| --- | --- |
| Browser / OS | Pinned Playwright Chromium in versioned Linux container |
| Viewports | desktop 1280×720; phone 393×852; targeted tablet/landscape |
| DPR | 1 |
| Locale / timezone | `en-CA` / `America/Toronto` |
| Clock | fixed per test, advanced explicitly |
| Motion | reduced; CSS animations/transitions disabled at capture |
| Fonts | bundled WOFF2, document waits for `document.fonts.ready` |
| Service workers | blocked unless the scenario explicitly tests them |
| Backend | Auth + Firestore emulators on fixed ports |
| Catalogue | versioned fixture seeded before the web server starts |
| Identity | real emulator anonymous users, one per browser context |
| Network | online unless the scenario explicitly toggles it |

Use CSS/DOM production surfaces so screenshots do not depend on WebGL. Remote
catalogue images are replaced by deterministic local fixture images through
seed data, not request interception of arbitrary production URLs.

## Emulator lifecycle and isolation

The Playwright `webServer` command runs inside one
`firebase emulators:exec --project ttlauncher-e2e --only auth,firestore` process:

1. start emulators on repository-pinned ports;
2. clear state;
3. load a versioned `Applications` fixture and any test user documents;
4. start the production-like Vite server with explicit emulator env vars;
5. run tests with one worker unless isolation has been proven; and
6. tear down the entire process.

Never rely on an emulator already running on a developer machine. A test that
mutates shared data uses a unique test ID and cleans through the emulator/admin
API. No test depends on execution order.

## External launch testing

Do not navigate to real game sites. Assert the popup contract:

```ts
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('link', { name: 'Launch Caravan' }).click()
]);
await expect(popup).toHaveURL('https://games.example.test/caravan');
expect(await popup.evaluate(() => window.opener)).toBeNull();
```

Also test invalid schemes, popup-blocked fallback, Enter/Space behavior where
appropriate, and that a launch record is not written on validation failure.

## Scenario inventory

| ID | Journey | Required evidence |
| --- | --- | --- |
| 001 | App shell | cold boot, current/offline badge, desktop + phone shell |
| 002 | Anonymous auth | silent first session, reload UID restore, distinct contexts |
| 003 | Library data | legacy parsing/order, image fallback, empty and invalid records |
| 004 | Find and inspect | search, clear, deep link, back/focus restoration |
| 005 | Launch | safe popup, invalid URL, blocked-popup fallback, recent update |
| 006 | Preferences/account | favourite persistence, Google link, collision merge, guest reset |
| 007 | Resilience | stale cache, disconnect/reconnect, permission denied, retry |
| 008 | Responsive/a11y | keyboard-only, 200% zoom, phone/landscape, reduced/forced colours |

## Visual baseline policy

- Canonical visual approval occurs in Linux CI only. macOS may run semantic E2E
  without maintaining a second source of visual truth.
- Use element screenshots only when the element is the review surface; use a
  viewport screenshot for layout journeys. Avoid `fullPage` on no-scroll views
  because it can hide accidental overflow.
- Mask only values that are intrinsically non-deterministic and not under test.
  Prefer fixing the source value. Broad masks are forbidden.
- Updating a baseline requires reading the before/after images, describing the
  intended visual change in the PR, and committing the generated walkthrough.
- Thresholds, per-channel tolerance, image smoothing, or retry are not substitutes
  for deterministic rendering.

## Accessibility checks

Automated checks are a floor. Each major journey also asserts:

- the focused element after navigation or dialog close;
- logical tab order and no keyboard trap;
- accessible names for all active controls;
- heading and landmark structure;
- status/error announcement semantics;
- 44×44 target geometry on touch viewports;
- no horizontal document overflow at 200% zoom; and
- no control overlap in every tested viewport.

The implementation PR documents one manual VoiceOver or NVDA pass per major
surface before release.

## Commands (implementation target)

```sh
npm run test:unit
npm run test:rules
npm run test:e2e
npm run test:e2e:update-snapshots
npm run verify:change
```

`verify:change` runs formatting, static checks, unit tests, rules tests, E2E,
the production build, `git diff --check`, and validation that no skipped/focused
tests or relaxed screenshot settings exist. Pre-commit hooks may call the same
script; they are never bypassed.

## Failure triage

1. Read the first semantic failure before examining the pixel diff.
2. Inspect trace, screenshot, console, and emulator logs attached by CI.
3. Reproduce in the pinned environment, not by changing the baseline locally.
4. Fix application state, fixture state, or an unpinned rendering input.
5. If the visual change is intended, update once in the canonical environment,
   inspect it, and describe it in the PR.
