const STEAM_API_KEY = process.env.STEAM_API_KEY ?? "";

interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
}

interface SteamGameDetail {
  name: string;
  steam_appid: number;
  header_image: string;
  developers?: string[];
  publishers?: string[];
  genres?: { description: string }[];
  short_description: string;
}

interface ImportableGame {
  title: string;
  steamAppId: string;
  coverImageUrl: string;
  playTimeHours: number;
  developer: string | null;
  publisher: string | null;
  genres: string[];
}

/**
 * Fetch a Steam user's owned games list.
 * Requires the user's Steam profile to be public and a valid API key.
 */
export async function getSteamLibrary(steamId: string): Promise<SteamOwnedGame[]> {
  if (!STEAM_API_KEY) {
    throw new Error("Steam API Key 未配置，请在 .env 中设置 STEAM_API_KEY");
  }

  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/");
  url.searchParams.set("key", STEAM_API_KEY);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("include_appinfo", "true");
  url.searchParams.set("include_played_free_games", "true");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!data.response?.games) {
    throw new Error("无法获取 Steam 游戏库。请确认 Steam ID 正确且个人资料设为公开。");
  }

  return data.response.games as SteamOwnedGame[];
}

/**
 * Get detailed information about a Steam app from the store API.
 * This endpoint does not require an API key.
 */
export async function getSteamGameDetail(appId: string): Promise<SteamGameDetail | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
  const res = await fetch(url.toString());
  const data = await res.json();

  if (!data[appId]?.success) {
    return null;
  }

  return data[appId].data as SteamGameDetail;
}

/**
 * Convert raw Steam library games into a format ready for import.
 */
export async function convertSteamGames(games: SteamOwnedGame[]): Promise<ImportableGame[]> {
  // Sort by playtime descending, take top 200
  const sorted = games
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 200);

  return sorted.map((game) => ({
    title: game.name,
    steamAppId: game.appid.toString(),
    coverImageUrl: `https://shared.steamstatic.com/store_item_assets/steam/apps/${game.appid}/library_600x900.jpg`,
    playTimeHours: Math.round((game.playtime_forever / 60) * 10) / 10, // minutes → hours
    developer: null, // Would need store API call (rate limited)
    publisher: null,
    genres: [],
  }));
}
