import { getBotTelemetry } from '@/lib/bot-telemetry';

function parseCsvIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

type DiscordPartialGuild = { id: string; owner?: boolean };

async function discordJson<T>(url: string, init: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await fetch(url, { ...init, next: { revalidate: 0 } });
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as T;
  return { ok: true, data };
}

/** Bot token: list guild ids the application is in (paginated, first page). */
export async function fetchBotGuildIds(botToken: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let after: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const qs = new URLSearchParams({ limit: '200' });
    if (after) qs.set('after', after);
    const r = await discordJson<DiscordPartialGuild[]>(
      `https://discord.com/api/v10/users/@me/guilds?${qs.toString()}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (!r.ok) break;
    const arr = r.data;
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const g of arr) {
      if (g && typeof g.id === 'string') ids.add(g.id);
    }
    if (arr.length < 200) break;
    after = arr[arr.length - 1]?.id;
    if (!after) break;
  }
  return ids;
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordPartialGuild[]> {
  const out: DiscordPartialGuild[] = [];
  let after: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const qs = new URLSearchParams({ limit: '200' });
    if (after) qs.set('after', after);
    const r = await discordJson<DiscordPartialGuild[]>(
      `https://discord.com/api/v10/users/@me/guilds?${qs.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!r.ok) return out;
    const arr = r.data;
    if (!Array.isArray(arr) || arr.length === 0) break;
    out.push(...arr);
    if (arr.length < 200) break;
    after = arr[arr.length - 1]?.id;
    if (!after) break;
  }
  return out;
}

type GuildMember = { roles?: string[] };

export async function fetchGuildMember(
  botToken: string,
  guildId: string,
  userId: string,
): Promise<GuildMember | null> {
  const r = await discordJson<GuildMember>(
    `https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Bot ${botToken}` } },
  );
  if (!r.ok) return null;
  return r.data;
}

async function botGuildIdsWithIngestFallback(botToken: string): Promise<Set<string>> {
  const fromApi = await fetchBotGuildIds(botToken);
  if (fromApi.size > 0) return fromApi;
  const { snapshot } = await getBotTelemetry();
  const ids = new Set<string>();
  for (const g of snapshot?.guilds ?? []) {
    ids.add(g.id);
  }
  return ids;
}

export async function assertDiscordDashboardAccess(input: {
  userId: string;
  accessToken: string;
  grantedScope: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { userId, accessToken, grantedScope } = input;
  const scopes = new Set(grantedScope.split(/\s+/).filter(Boolean));

  const allowlist = parseCsvIds(process.env['DASHBOARD_DISCORD_USER_IDS']);
  if (allowlist.length > 0) {
    if (!allowlist.includes(userId)) {
      return { ok: false, message: 'Your Discord account is not on the allow list for this dashboard.' };
    }
    return { ok: true };
  }

  const accessGuildId = process.env['DASHBOARD_ACCESS_GUILD_ID']?.trim();
  const roleIds = parseCsvIds(process.env['DASHBOARD_ACCESS_ROLE_IDS']);
  const botToken = process.env['DISCORD_BOT_TOKEN']?.trim();

  if (accessGuildId && roleIds.length > 0 && botToken) {
    const member = await fetchGuildMember(botToken, accessGuildId, userId);
    const memberRoles = new Set(member?.roles ?? []);
    const hasRole = roleIds.some((r) => memberRoles.has(r));
    if (!hasRole) {
      return {
        ok: false,
        message:
          'You need one of the configured roles in the access server. Ensure the bot can read members (Guild Members intent).',
      };
    }
    return { ok: true };
  }

  if (process.env['DASHBOARD_DISCORD_REQUIRE_BOT_GUILD_OWNER'] === 'true') {
    if (!scopes.has('guilds')) {
      return { ok: false, message: 'Set DISCORD_OAUTH_SCOPES to include guilds when using the bot-guild-owner gate.' };
    }
    if (!botToken) {
      return { ok: false, message: 'DISCORD_BOT_TOKEN is required for DASHBOARD_DISCORD_REQUIRE_BOT_GUILD_OWNER.' };
    }
    const botGuilds = await botGuildIdsWithIngestFallback(botToken);
    const userGuilds = await fetchUserGuilds(accessToken);
    const ownsInBot = userGuilds.some((g) => g.owner === true && botGuilds.has(g.id));
    if (!ownsInBot) {
      return {
        ok: false,
        message: 'You must own at least one server where this bot is present.',
      };
    }
    return { ok: true };
  }

  return { ok: true };
}
