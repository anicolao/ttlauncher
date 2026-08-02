export interface GameTile {
  id: string;
  title: string;
  iconSrc: string | null;
  launchUrl: string;
}

export interface RejectedGame {
  id: string;
  issues: string[];
}

export interface ParsedGame {
  game: GameTile | null;
  rejected: RejectedGame | null;
}

export function parseLegacyApplication(
  id: string,
  value: Record<string, unknown>,
  origin = 'https://launcher.example.test'
): ParsedGame {
  const issues: string[] = [];
  const title = typeof value.Title === 'string' ? value.Title.trim() : '';
  if (!title) issues.push('Title must be a non-empty string');

  const launchUrl = parseHttpsUrl(value.URL);
  if (!launchUrl) issues.push('URL must be an HTTPS URL without credentials');

  const iconSrc = parseIcon(value.Icon, origin);
  if (issues.length > 0) {
    return { game: null, rejected: { id, issues } };
  }

  return {
    game: { id, title, iconSrc, launchUrl: launchUrl! },
    rejected: null
  };
}

export function parseHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseIcon(value: unknown, origin: string): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const icon = value.trim();
  if (icon.startsWith('/') && !icon.startsWith('//') && !icon.includes('\\')) return icon;
  try {
    const url = new URL(icon, origin);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function sortGames(games: GameTile[], locale = 'en-CA'): GameTile[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  return [...games].sort(
    (left, right) => collator.compare(left.title, right.title) || left.id.localeCompare(right.id)
  );
}
