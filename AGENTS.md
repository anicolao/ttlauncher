# Agent guidelines

These rules apply to every change in this repository.

## Product invariants

1. This launcher runs only on a table-sized horizontal touch display that can be
   approached from any side or corner. There is no phone or personal-computer UI.
2. There is no privileged “top” edge. Game titles and controls must remain
   discoverable and usable from north, east, south, west, and corner approaches.
3. A game is exactly `id`, title, icon, and launch URL. Do not invent player
   counts, duration, categories, descriptions, setup, preferences, or game state.
4. Tapping a game launches its URL immediately. The launcher has no details,
   setup, confirmation, profile, favourites, recent-games, or settings surface.
5. Production data comes from the existing LauncherUI Firebase project. Never
   rename, rewrite, or bulk-migrate the `Applications` collection.
6. Authentication is silent Firebase anonymous auth. No account or sign-in UI is
   part of the tabletop experience.
7. All database access goes through typed adapters. UI components never import
   Firestore directly.
8. Game launch URLs are untrusted. Accept only validated `https:` URLs and open
   them with opener isolation.

## UI invariants

- Use semantic HTML/CSS for game tiles even when they are positioned radially.
- Keep every game hit target large enough for imprecise standing touch; the
  implementation floor is 120 × 120 CSS pixels at the reference viewport.
- Separate tap from drag with a movement threshold. A swipe rotates/browses the
  ring; a stationary tap launches the touched tile once.
- The entire launcher fits the installed 16:9 display without document scroll.
- Honour reduced motion and forced colours. Provide keyboard/service access as
  a fallback, but do not use conventional desktop layout as the visual model.
- Bundle and pin fonts and fixture icons. Do not fetch assets during E2E runs.
- Generated images in `docs/mockups/` are references, not production assets or
  pixel-perfect specifications.

## Testing invariants

- Follow `E2E_GUIDE.md`.
- Do not skip, quarantine, retry, or loosen a failing E2E test.
- Visual baselines use `maxDiffPixels: 0` in the canonical Linux container.
- Test touch entry and launch from all four edges and at least one corner.
- Every user-visible scenario uses the shared step helper so assertions,
  screenshots, and walkthrough documentation remain one atomic operation.
- E2E and rules tests use Firebase emulators only and never production.
- Never add an arbitrary sleep. Wait for a user-visible or protocol state.

## Workflow

- Keep changes scoped to one implementation increment.
- Update relevant design documents or an ADR when a decision changes.
- Run repository validation before committing. Once product code exists, run
  the full `verify:change` command described in `E2E_GUIDE.md`.
- PR descriptions state preview data mode and include the north/east/south/west
  touch evidence affected by the change.
