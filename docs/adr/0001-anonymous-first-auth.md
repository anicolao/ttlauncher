# ADR 0001: Anonymous-first Firebase authentication

- Status: Proposed
- Date: 2026-08-02

## Context

LauncherUI requires Google sign-in in production but uses a separate anonymous
button in local tests. Jaipur shows that Firebase anonymous auth can securely
identify a player without entrance friction. The launcher also benefits from an
optional cross-device account.

## Decision

Restore an existing Firebase session or silently create an anonymous session.
Offer Google as an optional credential link. Keep the Firebase user as the only
identity source and test the same flow with the Auth emulator.

## Consequences

- The existing authenticated catalogue rule continues to work.
- Anonymous Auth must be enabled in the existing project.
- Credential collision and preference merge become explicit product behavior.
- A mandatory sign-in route and external auth UI wrapper are unnecessary.
