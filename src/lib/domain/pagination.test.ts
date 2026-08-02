import { describe, expect, it } from 'vitest';
import type { GameTile } from './game-tile';
import { gamesForPage, nextPage, pageCount } from './pagination';

const games: GameTile[] = Array.from({ length: 18 }, (_, index) => ({
  id: String(index),
  title: `Game ${index}`,
  iconSrc: null,
  launchUrl: `https://example.test/${index}`
}));

describe('eight-game pages', () => {
  it.each([[0, 1], [8, 1], [9, 2], [18, 3]])('counts %i games as %i page(s)', (count, pages) => {
    expect(pageCount(count)).toBe(pages);
  });

  it('uses a short final page without repeating games', () => {
    expect(gamesForPage(games, 2).map(({ id }) => id)).toEqual(['16', '17']);
  });

  it('wraps the center-logo advance back to page one', () => {
    expect(nextPage(2, games.length)).toBe(0);
  });
});
