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
and then checks an explicit Firestore allow-list at `Administrators/{uid}`. An
administrator document grants access only when `Enabled` is `true`. Anonymous
sessions and signed-in accounts without that document remain read-only.

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
- Adding the first administrator requires one bootstrap allow-list document;
  subsequent catalogue maintenance happens in the editor.
- Removing or disabling the administrator document revokes write access on the
  next rules evaluation.
- Existing application documents require no migration and remain visible.
- Rollback can remove the editor while harmless `Hidden: false` values remain.
