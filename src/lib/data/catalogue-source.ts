import type { GameTile, RejectedGame } from '$lib/domain/game-tile';

export type CatalogueStatus = 'loading' | 'current' | 'offline' | 'empty' | 'error';

export interface CatalogueSnapshot {
  status: CatalogueStatus;
  games: GameTile[];
  rejected: RejectedGame[];
  message?: string;
}

export interface CatalogueSource {
  subscribe(listener: (snapshot: CatalogueSnapshot) => void): () => void;
}
