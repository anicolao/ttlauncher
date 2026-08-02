# Table Top Launcher

Table Top Launcher is a ground-up successor to
[`LauncherUI`](https://github.com/egirard/LauncherUI): a fast, welcoming front
door for a shared tabletop game library. It will keep the existing Firebase
project and `Applications` data while replacing the client, authentication
flow, visual system, and test discipline.

The first pull request now includes the design foundation and a runnable vertical
slice: silent anonymous Firebase access, the legacy catalogue adapter, the
omnidirectional game ring, center-logo paging, direct launch, and emulator-backed
Playwright evidence.

## Start here

| Document | Purpose |
| --- | --- |
| [Product brief](docs/PRODUCT_BRIEF.md) | Audience, outcomes, scope, and success measures |
| [Source audit](docs/CURRENT_STATE_AUDIT.md) | How LauncherUI works and how Jaipur differs |
| [Architecture](docs/ARCHITECTURE.md) | Proposed runtime, modules, boundaries, and launch flow |
| [Authentication](docs/AUTHENTICATION.md) | Silent anonymous auth for the shared appliance |
| [Data compatibility](docs/DATA_MODEL_AND_MIGRATION.md) | Exact contract with the existing Firestore database |
| [UX design](docs/UX_DESIGN.md) | Omnidirectional tabletop interaction, geometry, and mockups |
| [E2E guide](E2E_GUIDE.md) | Mandatory deterministic Playwright workflow and scenario plan |
| [PR previews](docs/PREVIEW_ENVIRONMENTS.md) | Preview deployment, data modes, secrets, and teardown |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Sequenced PRs and their exit criteria |
| [Decision records](docs/adr/README.md) | Durable architecture decisions |

## Interactive preview

Every same-repository pull request builds the launcher in fixture mode at a
PR-specific GitHub Pages path and posts the link on the PR. PR 1 is available at:

<https://anicolao.github.io/ttlauncher/pr-1/>

Run the local checks with:

```sh
npm run check
npm run test:unit
npm run test:rules
npm run test:e2e
```

## Status

- Product code: runnable vertical slice in this PR
- Backend: reuse the existing LauncherUI Firebase project
- Preview data: deterministic local fixture; no production connection
- License: [GNU GPL version 3](LICENSE)
