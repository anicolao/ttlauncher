import type { CatalogueSource } from './catalogue-source';
import { parseLegacyApplication, sortGames } from '$lib/domain/game-tile';

const fixtures = [
  ['caravan', 'Caravan', 'caravan'],
  ['dice-and-daggers', 'Dice & Daggers', 'daggers'],
  ['forest-light', 'Forest Light', 'forest'],
  ['hearthland', 'Hearthland', 'hearth'],
  ['mosaic', 'Mosaic', 'mosaic'],
  ['songbirds', 'Songbirds', 'songbird'],
  ['star-charts', 'Star Charts', 'stars'],
  ['tidelines', 'Tidelines', 'tides'],
  ['clockwork-cove', 'Clockwork Cove', 'hearth'],
  ['ember-isles', 'Ember Isles', 'caravan'],
  ['garden-guilds', 'Garden Guilds', 'forest'],
  ['lantern-market', 'Lantern Market', 'mosaic'],
  ['moonlit-maps', 'Moonlit Maps', 'stars'],
  ['paper-kingdoms', 'Paper Kingdoms', 'daggers'],
  ['river-stones', 'River Stones', 'tides'],
  ['winter-roost', 'Winter Roost', 'songbird'],
  ['aurora-lines', 'Aurora Lines', 'stars'],
  ['brass-and-bloom', 'Brass & Bloom', 'mosaic']
] as const;

export function createFixtureCatalogue(assetBase: string): CatalogueSource {
  const previewOrigin = import.meta.env.PUBLIC_FIXTURE_ORIGIN;
  const parsed = fixtures.map(([id, title, icon]) =>
    parseLegacyApplication(id, {
      Title: title,
      Icon: `${assetBase}/icons/${icon}.svg`,
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
