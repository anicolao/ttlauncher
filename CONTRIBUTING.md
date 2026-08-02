# Contributing

Read [AGENTS.md](AGENTS.md) and the relevant product/design documents before
changing behavior. Architecture changes require an ADR.

Use a scoped branch and draft PR. Keep generated visual evidence with the test
that owns it. Do not bypass hooks, skip tests, loosen screenshots, or connect
tests to production Firebase.

For the design-only foundation, run:

```sh
node scripts/validate-design-package.mjs
git diff --check
```

Once the application scaffold lands, use the `verify:change` command specified
in [the E2E guide](E2E_GUIDE.md). PRs should remain draft until their preview and
required evidence are available.
