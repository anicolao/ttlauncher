# Table Top Launcher

Table Top Launcher is a ground-up successor to
[`LauncherUI`](https://github.com/egirard/LauncherUI): a fast, welcoming front
door for a shared tabletop game library. It will keep the existing Firebase
project and `Applications` data while replacing the client, authentication
flow, visual system, and test discipline.

This first pull request is intentionally design-only. It establishes the
decisions, compatibility boundaries, delivery plan, E2E contract, and visual
direction that implementation PRs must follow.

## Start here

| Document | Purpose |
| --- | --- |
| [Product brief](docs/PRODUCT_BRIEF.md) | Audience, outcomes, scope, and success measures |
| [Source audit](docs/CURRENT_STATE_AUDIT.md) | How LauncherUI works and how Jaipur differs |
| [Architecture](docs/ARCHITECTURE.md) | Proposed runtime, modules, boundaries, and launch flow |
| [Authentication](docs/AUTHENTICATION.md) | Anonymous-first auth, account upgrade, and threat model |
| [Data compatibility](docs/DATA_MODEL_AND_MIGRATION.md) | Exact contract with the existing Firestore database |
| [UX design](docs/UX_DESIGN.md) | Interaction model, responsive behavior, tokens, and mockups |
| [E2E guide](E2E_GUIDE.md) | Mandatory deterministic Playwright workflow and scenario plan |
| [PR previews](docs/PREVIEW_ENVIRONMENTS.md) | Preview deployment, data modes, secrets, and teardown |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Sequenced PRs and their exit criteria |
| [Decision records](docs/adr/README.md) | Durable architecture decisions |

## Design preview

Every same-repository pull request deploys `preview/` to a PR-specific GitHub
Pages path and posts the link on the PR. The preview for PR 1 is expected at:

<https://anicolao.github.io/ttlauncher/pr-1/>

Validate this design package locally with:

```sh
node scripts/validate-design-package.mjs
```

## Status

- Product code: not started
- Backend: reuse the existing LauncherUI Firebase project
- License: [GNU GPL version 3](LICENSE)
