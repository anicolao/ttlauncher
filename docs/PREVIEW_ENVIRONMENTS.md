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
games through the right-side radial wiper in either direction, tap the logo to animate to
the next eight-game boundary, and exercise the real launch URLs.
Tabletop authentication is anonymous and silent. The editor write path is
enabled for full acceptance testing at `/edit`; Firestore Rules permit writes
only for signed-in users whose `users/{uid}` record has `catalogueEditor: true`.
Those writes update the shared live catalogue immediately.

## Application preview modes

Preview builds declare a mode in four small edge-facing labels:

| Mode | Source | Auth | Writes | Use |
| --- | --- | --- | --- | --- |
| `fixture` | Versioned local catalogue | In-memory ready state | None | Validation builds and fork-safe visual review |
| `live` (same-repository PR default) | Existing LauncherUI Firestore | Anonymous launcher / Google editor | Approved editor writes | Trusted compatibility and editor review |
| `emulator` | Local Firebase emulators | Auth emulator | Authorized test writes | Developer and automated E2E |
| `production` | Existing LauncherUI Firebase | Anonymous launcher / Google editor | Authorized editor writes | Released table and maintenance route |

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
- Live Firebase deployment is allowed only for branches in this repository,
  never forks, and
  uses repository/environment secrets for public Firebase web configuration.
- Do not give previews service-account keys or Firebase Admin access.
- Only review same-repository preview code before signing in with an approved
  editor account. Forks validate but do not deploy.
- The protected `users/{uid}.catalogueEditor` field in Firebase Rules and
  authorized origins remain the security boundary. Preview code cannot grant
  itself access.

## GitHub Pages setup and cleanup

Pages is served from `gh-pages` at `/`. After all application-quality jobs pass
for a push to `main`, the production build replaces the branch root and is
available at `https://anicolao.github.io/ttlauncher/`. That publish preserves
the `.nojekyll` file, repository license, optional custom-domain file, and every
numeric `pr-N` directory.

The preview workflow validates the numeric PR number, removes exactly that
tracked `pr-N` directory with `git rm`, rebuilds it, and commits only that path.
Other PR directories and the production root coexist untouched. Production and
preview publishes rebase and retry if another deployment updates `gh-pages`
first. Same-repository PRs deploy; forks validate only.

Closed-PR cleanup is a follow-up that deletes exactly `pr-<number>` after numeric
validation. Until then, static preview directories can remain harmlessly on the
Pages branch.

## Preview acceptance

- Bot URL, application assets, and nested static icons return HTTP 200.
- Relative assets work at nested `/pr-N/` paths.
- The page reports catalogue readiness from all four edges.
- Center-logo taps animate to the next catalogue boundary and wrap.
- During each ring step, the radial wiper shows complementary clipped outgoing
  and incoming games; at 45° it replaces exactly one while preserving eight slots
  and never launching a game.
- Same-PR updates preserve other preview directories.
- Failed validation never deploys.

## Production separation

A PR preview is not a production release. Only a validated push to `main`
updates the production root, using the same public Firebase web configuration
and silent anonymous launcher path as live previews. The `gh-pages` history
retains the preceding build for rollback. Preview editor changes are live data;
physical-table acceptance remains mandatory before promotion.
