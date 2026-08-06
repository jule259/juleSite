const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID ?? "";
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET ?? "";

let cachedToken: { token: string; expiresAt: number } | null = null;

interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  cover?: { url: string };
  screenshots?: { url: string }[];
  genres?: { name: string }[];
  platforms?: { name: string }[];
  involved_companies?: {
    company: { name: string };
    publisher: boolean;
    developer: boolean;
  }[];
}

export interface SearchResult {
  igdbId: number;
  title: string;
  summary: string | null;
  releaseDate: string | null;
  coverImageUrl: string | null;
  screenshots: string[];
  genres: string[];
  platforms: string[];
  developer: string | null;
  publisher: string | null;
}

/**
 * Get a Twitch OAuth token for IGDB API access.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  const data = await res.json();

  if (!data.access_token) {
    throw new Error("无法获取 IGDB 访问令牌，请检查 IGDB_CLIENT_ID 和 IGDB_CLIENT_SECRET");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // buffer 60s
  };

  return cachedToken.token;
}

function isConfigured(): boolean {
  return !!IGDB_CLIENT_ID && !!IGDB_CLIENT_SECRET;
}

/**
 * Search for games on IGDB by name.
 */
export async function searchIGDB(query: string): Promise<SearchResult[]> {
  if (!isConfigured()) {
    throw new Error("IGDB API 未配置，请在 .env 中设置 IGDB_CLIENT_ID 和 IGDB_CLIENT_SECRET");
  }

  const token = await getAccessToken();

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: `search "${query}"; fields name,summary,first_release_date,cover.url,screenshots.url,genres.name,platforms.name,involved_companies.company.name,involved_companies.publisher,involved_companies.developer; limit 10;`,
  });

  const games: IGDBGame[] = await res.json();

  return games.map((g) => {
    // 以 IGDB 返回的 URL 路径为基准，只替换大小变体并补 https: 协议头
    // （IGDB 返回的是协议相对路径，如 //images.igdb.com/igdb/image/upload/t_thumb/co670h.jpg）
    const coverUrl = g.cover?.url
      ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
      : null;

    const screenshots = (g.screenshots ?? [])
      .slice(0, 5)
      .map((s) => `https:${s.url.replace("t_thumb", "t_screenshot_big")}`);

    const developers = g.involved_companies
      ?.filter((c) => c.developer)
      .map((c) => c.company.name) ?? [];
    const publishers = g.involved_companies
      ?.filter((c) => c.publisher)
      .map((c) => c.company.name) ?? [];

    return {
      igdbId: g.id,
      title: g.name,
      summary: g.summary ?? null,
      releaseDate: g.first_release_date
        ? new Date(g.first_release_date * 1000).toISOString()
        : null,
      coverImageUrl: coverUrl,
      screenshots,
      genres: (g.genres ?? []).map((gen) => gen.name),
      platforms: (g.platforms ?? []).map((p) => p.name),
      developer: developers[0] ?? null,
      publisher: publishers[0] ?? null,
    };
  });
}
