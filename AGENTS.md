# Agent guidelines

These rules apply to every change in this repository.

## Product invariants

1. The launcher is the front door. The primary action must remain obvious and
   the desktop/tabletop library must fit a 16:9 viewport without page scroll.
2. Production data comes from the existing LauncherUI Firebase project. Never
   rename, rewrite, or bulk-migrate the `Applications` collection without an
   approved migration and rollback plan.
3. Authentication is anonymous-first. A returning Firebase session must never
   be interrupted by a mandatory account screen. Account upgrade is optional.
4. All database access goes through typed adapters. UI components never import
   Firestore directly.
5. Game launch URLs are untrusted data. Accept only validated `https:` URLs and
   open them with opener isolation.

## UI invariants

- Use semantic HTML and CSS for all interactive surfaces. Do not put essential
  controls or labels in canvas/WebGL.
- Honour reduced motion, forced colours, keyboard input, screen readers, and
  200% browser zoom.
- Interactive targets are at least 44 by 44 CSS pixels.
- Bundle and pin fonts. Do not fetch fonts or art during E2E runs.
- The generated images in `docs/mockups/` are references, not production assets
  or pixel-perfect specifications.

## Testing invariants

- Follow `E2E_GUIDE.md`.
- Do not skip, quarantine, retry, or loosen a failing E2E test to make CI pass.
- Visual baselines use `maxDiffPixels: 0` in the canonical Linux container.
- Every user-visible scenario uses the shared step helper so assertions,
  screenshots, and walkthrough documentation remain one atomic operation.
- E2E and rules tests use Firebase emulators only. Tests must never address the
  production Firebase project.
- Never add an arbitrary sleep. Wait for a user-visible or protocol state.

## Workflow

- Keep changes scoped to one implementation increment.
- Update relevant design documents or an ADR when a decision changes.
- Run the repository validation command before committing. Once product code
  exists, run the full `verify:change` command described in `E2E_GUIDE.md`.
- PR descriptions must state the data mode used by the preview and include a
  checklist for keyboard, mobile, and empty/error states.
