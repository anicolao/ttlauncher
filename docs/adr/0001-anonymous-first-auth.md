# ADR 0001: Silent anonymous-only Firebase authentication

- Status: Proposed
- Date: 2026-08-02

## Context

LauncherUI requires Google sign-in in production but uses a separate anonymous
action in local tests. Jaipur shows that Firebase anonymous auth can satisfy
authenticated rules without entrance friction. Table Top Launcher is a shared
appliance with no personal data or account-dependent feature.

## Decision

Restore an existing Firebase session or silently create an anonymous session in
every environment. Keep the Firebase UID internal. Do not implement sign-in,
profile, Google linking, sign-out, or user preferences.

## Consequences

- The existing authenticated catalogue rule continues to work.
- Anonymous Auth must be enabled in the existing project.
- Production and E2E exercise the same state machine.
- The tabletop surface has no identity UI and version one makes no Firestore
  writes.
