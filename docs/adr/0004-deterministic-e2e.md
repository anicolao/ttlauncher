# ADR 0004: Fixed-table emulator-only deterministic E2E

- Status: Proposed
- Date: 2026-08-02

## Context

The rewrite requires trustworthy behavioral and visual evidence without risking
the existing backend. Its defining risks are not responsive phone breakpoints;
they are radial geometry, edge orientation, touch arbitration, and simultaneous
access on one installed table.

## Decision

Run E2E against Firebase Auth/Firestore emulators and versioned fixture icons at
the 1920 × 1080 reference table viewport. Use pinned Linux Chromium for
zero-pixel baselines. Exercise north, east, south, west, and corner approaches
with real pointer input. Generate assertions, screenshots, and walkthroughs
through one step helper.

## Consequences

- Canonical visual review has one stable source of truth.
- Phone projects and conventional responsive snapshots are out of scope.
- Production connectivity is covered separately by protected read-only
  acceptance.
- Physical reach, glare, and palm behavior require a documented real-table pass
  in addition to automation.
