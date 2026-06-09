/**
 * Parse a PostgreSQL array literal string into a JavaScript array.
 * Handles format: {val1,val2,val3} or {"val with spaces",val2}
 *
 * Falls back gracefully: if the input is already an array, returns it as-is.
 * If it's null/undefined, returns an empty array.
 */
export function parsePgArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];

  const str = String(value).trim();
  if (!str.startsWith("{") || !str.endsWith("}")) return [];

  const inner = str.slice(1, -1);
  if (inner.length === 0) return [];

  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Normalize a game object's array fields (platforms, genres) from
 * PostgreSQL array literals to actual JavaScript arrays.
 */
export function normalizeGameArrays<T extends { platforms?: unknown; genres?: unknown; screenshots?: unknown }>(
  game: T,
): T {
  return {
    ...game,
    platforms: parsePgArray(game.platforms),
    genres: parsePgArray(game.genres),
    screenshots: parsePgArray(game.screenshots),
  };
}
