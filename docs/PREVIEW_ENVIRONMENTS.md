# Pull-request previews

## Preview contract

Every same-repository PR receives a stable URL:

```text
https://anicolao.github.io/ttlauncher/pr-<number>/
```

The workflow validates the package, publishes a PR-specific directory on
`gh-pages`, and updates one bot comment. Concurrent pushes to the same PR cancel
the older deployment.

This PR previews the runnable omnidirectional launcher against the existing
LauncherUI `Applications` catalogue. Reviewers can stream the current production
games through the fixed tunnel in either direction, tap the logo to animate to
the next eight-game boundary, and exercise the real launch URLs.
Authentication is anonymous and silent; the client has no Firestore write path.

## Application preview modes

Preview builds declare a mode in four small edge-facing labels:

| Mode | Source | Auth | Writes | Use |
| --- | --- | --- | --- | --- |
| `fixture` | Versioned local catalogue | In-memory ready state | None | Validation builds and fork-safe visual review |
| `live-read` (same-repository PR default) | Existing LauncherUI Firestore | Real anonymous Firebase auth | None | Trusted compatibility review |
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

- Fixture validation builds require only `GITHUB_TOKEN`.
- Live-read is allowed only for branches in this repository, never forks, and
  uses repository/environment secrets for public Firebase web configuration.
- Do not give previews service-account keys or Firebase Admin access.
- The app code has no Firestore write path in any mode.
- Firebase rules and authorized origins remain the security boundary.

## GitHub Pages setup and cleanup

Pages is served from `gh-pages` at `/`. The workflow validates the numeric PR
number, removes exactly that tracked `pr-N` directory with `git rm`, rebuilds it,
and commits only that path. Other PR directories coexist untouched.
Same-repository PRs deploy; forks validate only.

Closed-PR cleanup is a follow-up that deletes exactly `pr-<number>` after numeric
validation. Until then, static preview directories can remain harmlessly on the
Pages branch.

## Preview acceptance

- Bot URL, application assets, and nested static icons return HTTP 200.
- Relative assets work at nested `/pr-N/` paths.
- The page reports catalogue readiness from all four edges.
- Center-logo taps animate to the next catalogue boundary and wrap.
- Each 45° ring-drag step replaces exactly one game through the tunnel while
  preserving eight slots and never launching a game.
- Same-PR updates preserve other preview directories.
- Failed validation never deploys.

## Production separation

A PR preview is not a production release. Promotion is a separate protected
workflow using a CI-verified artifact and retaining the preceding Hosting release
for rollback. Live-read proves data compatibility only; physical-table acceptance
remains mandatory before promotion.
