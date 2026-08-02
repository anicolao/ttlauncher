import type { GameTile } from './game-tile';

export const PAGE_SIZE = 8;

export function pageCount(gameCount: number): number {
  return Math.max(1, Math.ceil(gameCount / PAGE_SIZE));
}

export function normalizePage(page: number, gameCount: number): number {
  const count = pageCount(gameCount);
  return ((page % count) + count) % count;
}

export function gamesForPage(games: GameTile[], page: number): GameTile[] {
  const normalized = normalizePage(page, games.length);
  const start = normalized * PAGE_SIZE;
  return games.slice(start, start + PAGE_SIZE);
}

export function nextPage(page: number, gameCount: number): number {
  return normalizePage(page + 1, gameCount);
}
