import { describe, expect, it } from 'vitest';
import type { GameTile } from './game-tile';
import {
  gamesForRing,
  nextPageBoundary,
  pageCount,
  pageForSequence
} from './pagination';

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

  it('keeps eight evenly spaced games on the ring across the final boundary', () => {
    expect(gamesForRing(games, 16).map(({ game }) => game.id)).toEqual([
      '16', '17', '0', '1', '2', '3', '4', '5'
    ]);
  });

  it('fills all eight slots by wrapping a smaller non-empty catalogue', () => {
    expect(gamesForRing(games.slice(0, 3), 0).map(({ game }) => game.id)).toEqual([
      '0', '1', '2', '0', '1', '2', '0', '1'
    ]);
  });

  it('advances from a partial spin to the next page boundary', () => {
    expect(nextPageBoundary(1, games.length)).toBe(8);
    expect(nextPageBoundary(8, games.length)).toBe(16);
  });

  it('wraps the final boundary to the first game without changing direction', () => {
    expect(nextPageBoundary(16, games.length)).toBe(18);
    expect(pageForSequence(18, games.length)).toBe(0);
  });

  it('supports reverse tunnel travel across the start of the catalogue', () => {
    expect(gamesForRing(games, -1).map(({ game }) => game.id)).toEqual([
      '17', '0', '1', '2', '3', '4', '5', '6'
    ]);
  });
});
