# ADR 0002: Preserve the legacy catalogue through an adapter

- Status: Proposed
- Date: 2026-08-02

## Context

The existing database uses `Applications` with capitalized `Title`, `URL`, and
`Icon` fields. A ground-up client is an opportunity for clean internal types,
but changing production data would couple client rollout to a risky migration.

## Decision

Read the existing collection unchanged. One runtime-validating adapter maps only
`Title`, `Icon`, and `URL` to an internal `GameTile`. Global catalogue writes
remain denied.

## Consequences

- New code has clean types without losing same-database compatibility.
- Invalid legacy records require explicit fallback/diagnostic behavior.
- Metadata or personalization requires a separately approved product/schema ADR.
- Client rollback never needs a catalogue restore.
