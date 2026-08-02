# Product brief

## Product promise

Table Top Launcher gets a group from “what should we play?” to a running game
without making anyone manage an account, interpret a technical dashboard, or
fight a display designed for one device class.

## Primary users

- **Host at a shared screen:** curates a library and starts a game for the room.
- **Player on a phone or tablet:** quickly finds and launches a game from a
  personal device.
- **Returning player:** expects preferences and recent games to persist without
  being forced through sign-in.
- **Maintainer:** needs deterministic evidence that UI, auth, and legacy data
  compatibility still work.

## Jobs to be done

1. See the available library and backend state immediately.
2. Resume a recent game in one action.
3. Search or filter by title, player count, and duration.
4. Inspect a game without losing library context.
5. Launch a validated game URL intentionally and safely.
6. Optionally attach a Google account to preserve preferences across devices.
7. Understand and recover from offline, auth, data, and launch failures.

## Principles

- **Play before profile.** Establish an anonymous Firebase session silently.
- **Calm, not cosmic.** Use the warmth of a well-kept game room, not the former
  orbit/space metaphor.
- **Fast at a glance.** Titles, player count, duration, and primary actions form
  the first scan path.
- **HTML is the interface.** Motion and art enrich semantic controls; they do not
  replace them.
- **Proof travels with the change.** E2E steps generate assertions, screenshots,
  and review documentation together.
- **Compatibility beats cleanup.** Adapt the legacy database at the boundary;
  do not force a production migration into the client rewrite.

## Version-one scope

- Anonymous-first Firebase Auth with optional Google upgrade
- Read the existing `Applications` collection from the existing database
- Responsive library, search/filter, game details, favourites, and recent games
- Safe external launch and explicit failure handling
- User preferences under the existing `users/{uid}` rule boundary
- Offline/cached library state with a visible freshness indicator
- Static SvelteKit deployment, Firebase emulators, unit/rules/E2E tests
- Per-PR previews with fixture mode by default and a protected live-read mode

## Non-goals

- Hosting or embedding individual games
- Editing the global game catalogue in version one
- Social graphs, matchmaking, payments, or chat
- Reusing LauncherUI's Threlte orbit implementation
- Migrating Jaipur game events into the launcher database
- Silent production writes from PR previews

## Success measures

- Warm start to an interactive cached library: under 1 second on a mid-range
  phone; cold start target under 2.5 seconds on a normal broadband connection.
- One primary action from library to launch for the recent game.
- 100% of critical flows covered by semantic assertions and canonical visual
  baselines.
- Zero production-data writes from automated tests and default PR previews.
- No forced sign-in prompt for first-time or returning anonymous players.
- WCAG 2.2 AA automated checks plus documented keyboard and screen-reader
  acceptance for each major surface.

## Release acceptance

Version one ships only after the parallel-read comparison against LauncherUI
shows the same set and order of valid applications, the auth upgrade flow has
rules tests, and the rollback is a hosting-channel switch rather than a database
restore.
