# Pull-request previews

## Preview contract

Every same-repository PR receives a stable URL:

```text
https://anicolao.github.io/ttlauncher/pr-<number>/
```

The workflow validates the package, publishes a PR-specific directory on
`gh-pages`, and updates one bot comment. Concurrent pushes to the same PR cancel
the older deployment.

This design PR previews the omnidirectional mockups and interaction contract. It
does not impersonate a working launcher or connect to Firebase.

## Application preview modes

Once the Svelte app exists, preview builds declare a mode in four small
edge-facing build labels or a service-only diagnostics overlay:

| Mode | Source | Auth | Writes | Use |
| --- | --- | --- | --- | --- |
| `fixture` (default) | Versioned local catalogue | In-memory/emulated ready state | None | Ordinary and fork-safe visual review |
| `live-read` | Existing LauncherUI Firestore | Real anonymous Firebase auth | None | Trusted compatibility review |
| `emulator` | Local Firebase emulators | Auth emulator | None | Developer and automated E2E |
| `production` | Existing LauncherUI Firebase | Real anonymous auth | None | Released table only |

Mode is a required build-time variable. Unknown mode fails closed; hostname
guessing is forbidden.

## Preview viewport

The application preview opens at 1920 × 1080 and documents that fixed table
assumption. Reviewers may scale the browser to view it, but CSS breakpoints must
not transform it into a phone or conventional desktop UI. Automated preview
smoke checks verify:

- the entire radial surface is present with no document scroll;
- north/east/south/west tiles and handles exist;
- exactly title and icon content appears on valid game tiles; and
- no profile, setup, details, filter, or settings control is present.

## Secrets and trust boundary

- Fixture previews require only `GITHUB_TOKEN`.
- Live-read is allowed only for branches in this repository, never forks, and
  uses repository/environment secrets for public Firebase web configuration.
- Do not give previews service-account keys or Firebase Admin access.
- The app code has no Firestore write path in any mode.
- Firebase rules and authorized origins remain the security boundary.

## GitHub Pages setup and cleanup

Pages is served from `gh-pages` at `/`. The publish action uses `keep_files: true`
so PR directories coexist. Same-repository PRs deploy; forks validate only.

Closed-PR cleanup is a follow-up that deletes exactly `pr-<number>` after numeric
validation. Until then, static preview directories can remain harmlessly on the
Pages branch.

## Preview acceptance

- Bot URL and both tabletop mockup assets return HTTP 200.
- Relative assets work at nested `/pr-N/` paths.
- The page visibly states design-only or fixture mode.
- Same-PR updates preserve other preview directories.
- Failed validation never deploys.

## Production separation

A PR preview is not a production release. Promotion is a separate protected
workflow using a CI-verified artifact and retaining the preceding Hosting release
for rollback. Live-read proves data compatibility only; physical-table acceptance
remains mandatory before promotion.
