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
  Hidden?: unknown;
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
- `Hidden === true` suppresses the record before a `GameTile` is constructed.
  Missing, false, and malformed values remain visible for legacy compatibility.
- Titles sort with one pinned collator before radial placement.
- Invalid records are excluded from active tiles and counted in a non-sensitive
  diagnostics state; malformed values are never rendered as HTML.

## Fields intentionally absent

Do not read, infer, cache, or display player count, duration, genre, description,
setup, options, popularity, recent activity, favourites, categories, or user
preferences. The launcher cannot promise facts its backend does not supply.

The tabletop route does not read or write `users/{uid}`. Its anonymous Firebase
Auth session exists solely to satisfy the authenticated catalogue rule. The
separate maintenance route records the signed-in Google email and reads the
`catalogueEditor` authorization field from its own `users/{uid}` document.

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
  create/update: users with catalogueEditor == true; validated catalogue fields
  delete: denied

users/{uid}
  read: matching signed-in uid only
  create/update: matching signed-in uid, except catalogueEditor is protected
  delete: matching signed-in uid (self-revocation is safe)

everything else used by this client
  denied
```

Existing unrelated rules may remain for compatibility. Rules tests prove
authenticated reads, unauthenticated and anonymous write denial, non-editor
write denial, profile-granted editor access, field validation, approved editor
create/update, protected `catalogueEditor` membership, preserved `users/{uid}`
access, and application delete denial.

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

Rollback changes the hosted client and rules. Existing documents require no
migration; `Hidden` can be removed or ignored by the preceding launcher.

## Future evolution

Any further catalogue metadata, personalization, or launch parameters change the
product contract and require another ADR, schema/rules design, omnidirectional
UX review, and explicit user approval. They must not slip into a tile as
“optional” fields.
