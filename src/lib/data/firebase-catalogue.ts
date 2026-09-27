import {
  collection,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
import { isLegacyApplicationHidden, parseLegacyApplication, sortGames } from '$lib/domain/game-tile';
import type { CatalogueSource } from './catalogue-source';
import { ensureFirebaseSession } from './firebase-client';

export async function createFirebaseCatalogue(): Promise<CatalogueSource> {
  const { db } = await ensureFirebaseSession();
  return {
    subscribe(listener) {
      listener({ status: 'loading', games: [], rejected: [] });
      const applications = query(collection(db, 'Applications'), orderBy('Title'));
      return onSnapshot(
        applications,
        { includeMetadataChanges: true },
        (snapshot) => {
          const parsed = snapshot.docs.flatMap((document) => {
            const value = document.data();
            return isLegacyApplicationHidden(value)
              ? []
              : [parseLegacyApplication(document.id, value)];
          });
          const games = sortGames(parsed.flatMap(({ game }) => (game ? [game] : [])));
          const rejected = parsed.flatMap(({ rejected }) => (rejected ? [rejected] : []));
          listener({
            status: snapshot.metadata.fromCache ? 'offline' : games.length > 0 ? 'current' : 'empty',
            games,
            rejected
          });
        },
        () => listener({ status: 'error', games: [], rejected: [], message: 'Could not load games' })
      );
    }
  };
}
