import type { GameTile } from './game-tile';

export const PAGE_SIZE = 8;

export interface RingGame {
  game: GameTile;
  catalogueIndex: number;
  sequenceIndex: number;
  key: string;
}

export function pageCount(gameCount: number): number {
  return Math.max(1, Math.ceil(gameCount / PAGE_SIZE));
}

export function normalizeGameIndex(index: number, gameCount: number): number {
  if (gameCount <= 0) return 0;
  return ((index % gameCount) + gameCount) % gameCount;
}

export function gameForSequence(games: GameTile[], sequenceIndex: number): RingGame | null {
  if (games.length === 0) return null;
  const catalogueIndex = normalizeGameIndex(sequenceIndex, games.length);
  const game = games[catalogueIndex];
  return {
    game,
    catalogueIndex,
    sequenceIndex,
    key: `${game.id}:${sequenceIndex}`
  };
}

export function gamesForRing(games: GameTile[], sequenceStart: number): RingGame[] {
  if (games.length === 0) return [];
  return Array.from(
    { length: PAGE_SIZE },
    (_, offset) => gameForSequence(games, sequenceStart + offset)!
  );
}

export function pageForSequence(sequenceStart: number, gameCount: number): number {
  if (gameCount <= 0) return 0;
  return Math.floor(normalizeGameIndex(sequenceStart, gameCount) / PAGE_SIZE);
}

export function nextPageBoundary(sequenceStart: number, gameCount: number): number {
  if (gameCount <= PAGE_SIZE) return sequenceStart;
  const normalized = normalizeGameIndex(sequenceStart, gameCount);
  const candidate = (Math.floor(normalized / PAGE_SIZE) + 1) * PAGE_SIZE;
  const distance = candidate >= gameCount ? gameCount - normalized : candidate - normalized;
  return sequenceStart + distance;
}
