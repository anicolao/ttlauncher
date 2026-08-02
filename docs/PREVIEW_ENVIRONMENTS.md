# Pull-request previews

## Preview contract

Every same-repository PR receives a stable URL:

```text
https://anicolao.github.io/ttlauncher/pr-<number>/
```

The workflow validates the design package, publishes a PR-specific directory on
the `gh-pages` branch, and creates or updates one bot comment with the link.
Concurrent pushes to the same PR cancel the older deployment.

This initial design PR previews `preview/index.html` plus the three mockups. It
does not impersonate a working product or connect to Firebase.

## Application preview modes

Once the Svelte app exists, preview builds must declare one mode visibly in the
support/profile panel and PR description:

| Mode | Source | Auth | Writes | Use |
| --- | --- | --- | --- | --- |
| `fixture` (default) | Versioned local catalogue | In-memory guest facade | None | Forks and ordinary UI review |
| `live-read` | Existing LauncherUI Firestore | Real Firebase anonymous auth | Catalogue read; preferences disabled | Trusted compatibility review |
| `emulator` | Local Firebase emulators | Auth emulator | Isolated emulator only | Developer and automated E2E |
| `production` | Existing LauncherUI Firebase | Real Firebase | Rules-controlled | Released site only |

Mode is a required build-time variable. The app must fail closed on an unknown
mode; it must not choose production based on hostname.

## Secrets and trust boundary

- Fixture previews need only the repository `GITHUB_TOKEN`.
- Live-read previews are allowed only for branches in this repository, never
  forks, and use repository/environment secrets containing the public Firebase
  web configuration.
- Firebase web config is not an authorization secret, but centralizing it avoids
  accidental project drift. Firestore rules and Auth authorized domains remain
  the security boundary.
- Do not give preview workflows service-account keys or Firebase Admin access.
- Do not expose user preference writes in live-read mode.

## GitHub Pages setup

Repository administration enables Pages from the `gh-pages` branch at `/`.
The preview workflow uses `keep_files: true` so multiple PR directories can
coexist. The initial repository setup performs this once; the workflow does not
need admin credentials.

The workflow intentionally deploys same-repository PRs only. Fork PRs still run
validation but do not receive a write token or deployment.

## Cleanup

Closed-PR cleanup is a follow-up to the scaffold, implemented as a separate job
that deletes exactly `pr-<number>` from `gh-pages`. It must validate that the
number is numeric and must never use a broad recursive target. Until that job is
implemented, old preview directories are harmless static artifacts and can be
removed manually from the Pages branch.

## Preview acceptance

- The bot comment URL returns HTTP 200 after deployment.
- Relative CSS and image URLs work at the nested `/pr-N/` base path.
- Refreshing any application route works after the Svelte fallback is added.
- The page visibly names its data mode.
- Same-PR updates replace that directory without deleting other previews.
- Failed validation never deploys.

## Production separation

A PR preview is not a Firebase Hosting release candidate. Promotion to the
existing production hosting surface is a separate, protected workflow that uses
a built artifact already verified by CI, records the hosting release, and keeps
the preceding release available for rollback.
