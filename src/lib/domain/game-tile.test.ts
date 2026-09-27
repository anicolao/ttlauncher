import { describe, expect, it } from 'vitest';
import {
  isLegacyApplicationHidden,
  parseHttpsUrl,
  parseLegacyApplication,
  sortGames
} from './game-tile';

describe('legacy application adapter', () => {
  it('maps the existing Title/Icon/URL shape without adding launcher metadata', () => {
    expect(
      parseLegacyApplication('caravan', {
        Title: ' Caravan ',
        Icon: '/icons/caravan.svg',
        URL: 'https://games.example.test/caravan'
      })
    ).toEqual({
      game: {
        id: 'caravan',
        title: 'Caravan',
        iconSrc: '/icons/caravan.svg',
        launchUrl: 'https://games.example.test/caravan'
      },
      rejected: null
    });
  });

  it.each([
    'http://games.example.test/caravan',
    'javascript:alert(1)',
    'https://user:secret@games.example.test/caravan',
    'not a url'
  ])('rejects unsafe launch URL %s', (url) => {
    expect(parseHttpsUrl(url)).toBeNull();
  });

  it('rejects incomplete records and tolerates a missing icon', () => {
    expect(parseLegacyApplication('broken', { Title: '', URL: '/relative' }).game).toBeNull();
    expect(
      parseLegacyApplication('plain', {
        Title: 'Plain Game',
        URL: 'https://games.example.test/plain'
      }).game?.iconSrc
    ).toBeNull();
  });

  it('sorts titles deterministically and uses ids as a tie breaker', () => {
    const games = [
      { id: 'b', title: 'Game 10', iconSrc: null, launchUrl: 'https://example.test/b' },
      { id: 'c', title: 'game 2', iconSrc: null, launchUrl: 'https://example.test/c' },
      { id: 'a', title: 'Game 2', iconSrc: null, launchUrl: 'https://example.test/a' }
    ];
    expect(sortGames(games).map(({ id }) => id)).toEqual(['a', 'c', 'b']);
  });

  it('treats only an explicit Hidden true value as hidden', () => {
    expect(isLegacyApplicationHidden({ Hidden: true })).toBe(true);
    expect(isLegacyApplicationHidden({ Hidden: false })).toBe(false);
    expect(isLegacyApplicationHidden({})).toBe(false);
    expect(isLegacyApplicationHidden({ Hidden: 'true' })).toBe(false);
  });
});
