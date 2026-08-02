# Data compatibility and migration

## Constraint

Version one uses the same Firebase project, Firestore database, and default
database as LauncherUI. The rewrite must be deployable without changing or
copying the existing `Applications` documents.

The concrete Firebase project identifier and web configuration stay in
environment configuration and GitHub secrets. The design documents intentionally
do not duplicate those values.

## Legacy catalogue contract

Observed LauncherUI query:

```ts
query(collection(firestore, 'Applications'), orderBy('Title'))
```

Observed document shape:

```ts
interface LegacyApplication {
  Title?: unknown;
  URL?: unknown;
  Icon?: unknown;
}
```

The capitalized collection and field names are compatibility-sensitive. The
new client reads them unchanged through one adapter and maps them to an internal
model:

```ts
interface GameSummary {
  id: string;
  title: string;
  launchUrl: URL;
  iconUrl: URL | null;
  availability: 'launchable' | 'invalid';
  issues: CatalogueIssue[];
}
```

Validation rules:

- `id` is the Firestore document ID and is never derived from the title.
- `Title` must be a trimmed, non-empty string. Invalid records are excluded from
  normal results and counted in a non-sensitive diagnostics state.
- `URL` must parse as `https:`. `javascript:`, `data:`, credentials in URLs, and
  non-HTTPS production URLs are rejected.
- `Icon` may be an `https:` URL or a safe site-relative asset path. Failure falls
  back to an in-app placeholder and never blocks launch.
- Client ordering uses a pinned locale/collator after validation, while a
  compatibility test compares its result with legacy `orderBy('Title')` data.

## Preferences contract

LauncherUI's existing rules already reserve `users/{uid}` for its owner. The
new client stores one bounded document there; this remains subject to rules
validation in an implementation PR.

```ts
interface UserPreferencesV1 {
  schemaVersion: 1;
  favouriteGameIds: string[];       // unique, maximum 100
  recentGames: Array<{
    gameId: string;
    launchedAt: Timestamp;
  }>;                               // newest first, maximum 20
  appearance: 'system' | 'dark';
  updatedAt: Timestamp;
}
```

Do not create a client-writeable global favourites or play-count collection.
No preference can grant access or alter a catalogue application.

## Firestore rules target

The first implementation should preserve effective catalogue access and tighten
user writes:

```text
Applications/{document=**}
  read: authenticated
  write: denied

users/{uid}
  read: authenticated owner
  create/update: authenticated owner + exact allowed fields + size/type limits
  delete: authenticated owner

everything else
  denied
```

Rules changes are deployed only after emulator tests pass against valid,
unauthenticated, cross-user, extra-field, oversize, and wrong-type requests.

## Cache

The client keeps a versioned IndexedDB snapshot containing only normalized
catalogue fields and a server-read timestamp. Cached content is rendered only
after auth restoration and is labelled Offline or Updating until a server
snapshot arrives. A schema-version mismatch discards the cache safely.

Images use normal browser caching with an in-app fallback. Service-worker
precache must not enumerate third-party catalogue art.

## Migration and rollout

No data rewrite is required for the initial release.

1. Export or otherwise verify a recoverable backup according to the Firebase
   project's normal operating procedure.
2. Run a read-only catalogue audit that reports invalid legacy records without
   mutating them.
3. Enable anonymous Auth in the existing project.
4. Deploy tightened `users/{uid}` rules only if their emulator suite proves
   backward compatibility for any known LauncherUI user document.
5. Deploy Table Top Launcher to a separate Hosting preview channel.
6. Run both clients against the same database and compare normalized IDs,
   titles, URLs, and ordering.
7. Promote the new hosting release. Keep the previous hosting release available
   for immediate rollback.

Rollback changes the hosted client only. Because the catalogue is untouched and
preferences are namespaced/versioned, rollback does not require restoring the
database.

## Future catalogue evolution

New optional metadata—player counts, duration, description, tags, and hero
art—may be introduced only as backward-compatible fields. Until populated, the
UI uses honest “Not provided” states; it must not infer factual game metadata
from titles or generated mockups. An admin-owned catalogue schema and migration
tool require a separate ADR.
