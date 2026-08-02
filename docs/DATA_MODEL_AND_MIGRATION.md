# Data compatibility and migration

## Constraint

Version one uses the same Firebase project, Firestore database, and default
database as LauncherUI. The rewrite must be deployable without changing or
copying the existing `Applications` documents.

The concrete Firebase project identifier and web configuration remain in
environment configuration and repository secrets.

## Complete product data contract

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

That is the entire launcher data model. The new client reads those fields
unchanged through one adapter:

```ts
interface GameTile {
  id: string;
  title: string;
  iconUrl: URL | null;
  launchUrl: URL;
  availability: 'launchable' | 'invalid';
  issues: CatalogueIssue[];
}
```

Validation rules:

- `id` is the Firestore document ID and is never derived from title.
- `Title` must be a trimmed non-empty string and is the tile's only visible text.
- `URL` must parse as `https:`. Credentials, `javascript:`, `data:`, and non-HTTPS
  production targets are rejected.
- `Icon` may be an `https:` URL or a safe site-relative asset path. Failure uses
  a deterministic placeholder without blocking a valid launch URL.
- Titles sort with one pinned collator before radial placement.
- Invalid records are excluded from active tiles and counted in a non-sensitive
  diagnostics state; malformed values are never rendered as HTML.

## Fields intentionally absent

Do not read, infer, cache, or display player count, duration, genre, description,
setup, options, popularity, recent activity, favourites, categories, or user
preferences. The launcher cannot promise facts its backend does not supply.

Version one does not read or write `users/{uid}`. Firebase Auth exists solely to
satisfy the authenticated catalogue rule.

## Cache

The appliance keeps a versioned IndexedDB snapshot containing normalized title,
icon URL, launch URL, document ID, and a server-read timestamp. Cached tiles may
appear only after auth restoration and are labelled Offline around every table
edge until a server snapshot arrives. A schema mismatch discards the cache.

Remote icons use normal browser caching plus a deterministic fallback. E2E uses
only repository fixture icons.

## Firestore rules target

Version one preserves the effective production boundary:

```text
Applications/{document=**}
  read: authenticated
  write: denied

everything else used by this client
  denied
```

Existing unrelated rules may remain for compatibility, but the ttlauncher code
must contain no path that writes them. Rules tests prove authenticated reads,
unauthenticated denial, and all catalogue writes denied.

## Migration and rollout

No data rewrite is required.

1. Verify a recoverable backup under the Firebase project's normal procedure.
2. Run a read-only audit that reports invalid legacy records without mutation.
3. Enable anonymous Auth in the existing project.
4. Deploy to a separate Hosting preview channel.
5. Run LauncherUI and Table Top Launcher against the same database and compare
   normalized IDs, titles, icon targets, launch URLs, and ordering.
6. Exercise every valid game URL from a protected acceptance environment.
7. Promote the new hosting release and retain the preceding release for rollback.

Rollback changes the hosted client only. There are no ttlauncher writes or data
migrations to undo.

## Future evolution

Any request for catalogue metadata, personalization, admin editing, or launch
parameters changes the product contract and requires a new ADR, schema/rules
design, omnidirectional UX review, and explicit user approval. It must not slip
into a tile as an “optional” field.
