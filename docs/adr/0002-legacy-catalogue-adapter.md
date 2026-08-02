# ADR 0002: Preserve the legacy catalogue through an adapter

- Status: Proposed
- Date: 2026-08-02

## Context

The existing database uses `Applications` with capitalized `Title`, `URL`, and
`Icon` fields. A ground-up client is an opportunity for clean internal types,
but changing production data would couple client rollout to a risky migration.

## Decision

Read the existing collection unchanged. One runtime-validating adapter maps it
to an internal `GameSummary`. Global catalogue writes remain denied.

## Consequences

- New code has clean types without losing same-database compatibility.
- Invalid legacy records require explicit fallback/diagnostic behavior.
- Future metadata remains optional until a separately approved admin migration.
- Client rollback never needs a catalogue restore.
