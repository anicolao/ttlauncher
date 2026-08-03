import type { CatalogueSource } from './catalogue-source';
import { parseLegacyApplication, sortGames } from '$lib/domain/game-tile';

const fixtures = [
  ['caravan', 'Caravan', 'caravan'],
  ['dice-and-daggers', 'Dice & Daggers', 'dice-and-daggers'],
  ['forest-light', 'Forest Light', 'forest-light'],
  ['hearthland', 'Hearthland', 'hearthland'],
  ['mosaic', 'Mosaic', 'mosaic'],
  ['songbirds', 'Songbirds', 'songbirds'],
  ['star-charts', 'Star Charts', 'aurora-lines'],
  ['tidelines', 'Tidelines', 'tidelines'],
  ['clockwork-cove', 'Clockwork Cove', 'mosaic'],
  ['ember-isles', 'Ember Isles', 'caravan'],
  ['garden-guilds', 'Garden Guilds', 'songbirds'],
  ['lantern-market', 'Lantern Market', 'mosaic'],
  ['moonlit-maps', 'Moonlit Maps', 'aurora-lines'],
  ['paper-kingdoms', 'Paper Kingdoms', 'dice-and-daggers'],
  ['river-stones', 'River Stones', 'tidelines'],
  ['winter-roost', 'Winter Roost', 'hearthland'],
  ['aurora-lines', 'Aurora Lines', 'aurora-lines'],
  ['brass-and-bloom', 'Brass & Bloom', 'songbirds']
] as const;

export function createFixtureCatalogue(assetBase: string): CatalogueSource {
  const previewOrigin = import.meta.env.PUBLIC_FIXTURE_ORIGIN;
  const parsed = fixtures.map(([id, title, icon]) =>
    parseLegacyApplication(id, {
      Title: title,
      Icon: `${assetBase}/art/${icon}.png`,
      URL: previewOrigin
        ? new URL(`${assetBase}/fixture-game.html?game=${id}`, previewOrigin).toString()
        : `https://games.example.test/${id}`
    })
  );
  const games = sortGames(parsed.flatMap(({ game }) => (game ? [game] : [])));

  return {
    subscribe(listener) {
      listener({ status: games.length > 0 ? 'current' : 'empty', games, rejected: [] });
      return () => {};
    }
  };
}
