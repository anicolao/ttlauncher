# ADR 0005: Separate authenticated catalogue editor

- Status: Accepted
- Date: 2026-09-27
- Supersedes: ADR 0001 and ADR 0002 only for the maintenance route and approved catalogue writes

## Context

Maintaining the shared game list in the Firebase console is slow and makes it
hard to temporarily remove debug titles. The tabletop launcher must still wake
without identity UI, launch games immediately, and expose no settings or account
surface to players.

The existing `Applications` collection cannot be renamed or bulk-migrated. Its
legacy `Title`, `URL`, and `Icon` fields remain the production source of truth.

## Decision

Add a separately addressed `/edit` maintenance route. It requires Google sign-in
and an exact verified-email allow-list. Firestore Rules authorize only
`anicolao@gmail.com` and `egirard@gmail.com`; a matching client check provides an
early denied state but is not the security boundary. Anonymous sessions,
unverified email claims, and all other signed-in accounts remain read-only.

Same-repository PR previews enable this editor against the shared LauncherUI
project so catalogue maintenance can be tested before merge. The editor displays
that changes are live. Fork previews never receive Firebase configuration or
deploy executable preview code.

Approved editors may create applications and update `Title`, `URL`, `Icon`, and
the optional boolean `Hidden`. They may not delete applications or change other
fields. A missing or false `Hidden` value means visible. A true value prevents
the catalogue adapter from constructing a `GameTile`, so the launcher model
remains exactly `id`, title, icon, and launch URL.

Firebase access stays behind typed data adapters. The editor UI does not import
Auth or Firestore. The tabletop route remains anonymous-first and contains no
link, sign-in prompt, profile, or editor controls.

## Consequences

- Google Auth must be enabled in the existing Firebase project.
- Firestore Rules must be deployed before the editor can write production data.
- Changing editor membership requires a reviewed rules and client allow-list
  change; there is no mutable authorization collection to misconfigure.
- Approved edits made from a PR preview affect the live shared catalogue.
- Existing application documents require no migration and remain visible.
- Rollback can remove the editor while harmless `Hidden: false` values remain.
