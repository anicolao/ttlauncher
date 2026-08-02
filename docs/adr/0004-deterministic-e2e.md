# ADR 0004: Emulator-only deterministic E2E

- Status: Proposed
- Date: 2026-08-02

## Context

The rewrite requires trustworthy behavior and visual evidence without risking
the existing backend. Cross-platform font and GPU differences make multiple
visual sources of truth costly and ambiguous.

## Decision

Run E2E against Firebase Auth/Firestore emulators, a versioned fixture, and one
pinned Linux Chromium environment for zero-pixel visual baselines. Use a shared
step helper to generate assertions, screenshots, and walkthroughs together.

## Consequences

- Tests cannot validate production connectivity directly; a separate protected
  read-only compatibility check covers that boundary.
- Canonical visual reviews are repeatable and have one source of truth.
- Emulator setup and fixture lifecycle are production code-quality concerns.
