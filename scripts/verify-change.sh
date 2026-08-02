#!/usr/bin/env bash
set -euo pipefail

node scripts/validate-design-package.mjs
npm run check
npm run test:unit
npm run test:rules
npm run test:e2e
npm run build
git diff --check

if rg -n 'test\.(skip|only)|describe\.(skip|only)|waitForTimeout|\bsleep\b' src tests scripts --glob '!verify-change.sh'; then
  echo 'Forbidden skipped/focused test or arbitrary wait found.' >&2
  exit 1
fi

if rg -n 'maxDiffPixels:\s*[1-9]' playwright.config.ts tests; then
  echo 'Visual tolerance must remain maxDiffPixels: 0.' >&2
  exit 1
fi
