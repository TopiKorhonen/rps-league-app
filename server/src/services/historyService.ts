import { rpsApi } from "./rpsApi";
import type { RawHistoryItem, Match } from "../types/history";
import { mapHistoryItemToMatch } from "../utils/mapHistoryItemToMatch";
import { getMatchDate } from "../utils/getMatchDate";
import { isValidMatchDate } from "../utils/isValidMatchDate";

// The legacy API is rate-limited, so requests are globally spaced out
// and retried with backoff when a 429 response is returned.
let lastLegacyApiRequestAt = 0;

// Cache expensive historical queries for a short time to avoid
// repeatedly crawling the cursor-based legacy API.
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const dayCache = new Map<string, CacheEntry<Match[]>>();
const rangeCache = new Map<string, CacheEntry<Match[]>>();

function getCachedValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string
): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function setCachedValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs = 5 * 60 * 1000
): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

async function waitForLegacyApiSlot(minIntervalMs = 350): Promise<void> {
  const now = Date.now();
  const waitMs = Math.max(0, lastLegacyApiRequestAt + minIntervalMs - now);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastLegacyApiRequestAt = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface HistoryResponse {
  data: RawHistoryItem[];
  cursor?: string | null;
}

async function fetchHistoryPageWithRetry(
  path: string,
  maxRetries = 5
): Promise<{ matches: Match[]; next: string | null }> {
  let attempt = 0;

  while (true) {
    try {
      await waitForLegacyApiSlot(350);
      return await fetchHistoryPage(path);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 429 && attempt < maxRetries) {
        const delayMs = 1500 * Math.pow(2, attempt);

        console.warn(
          `429 from legacy API for ${path}. Retry ${attempt + 1} in ${delayMs}ms`
        );

        await sleep(delayMs);
        attempt++;
        continue;
      }

      throw error;
    }
  }
}

export async function fetchHistoryPage(path = "/history"): Promise<{
  matches: Match[];
  next: string | null;
}> {
  const response = await rpsApi.get<HistoryResponse>(path);

  const rawItems = response.data.data ?? [];

  const matches = rawItems
    .filter((item) => item.type === "GAME_RESULT")
    .map(mapHistoryItemToMatch)
    .filter(isValidMatchDate);

  return {
    matches,
    next: response.data.cursor ?? null,
  };
}

// Start historical queries from a known checkpoint when possible,
// instead of always scanning from the newest page.
export async function fetchMatchesForDate(
  targetDate: string,
  maxPages = 2000,
  startPath = "/history"
): Promise<Match[]> {
  const cacheKey = `day:${targetDate}`;
  const cached = getCachedValue(dayCache, cacheKey);

  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }

  let path: string | null = startPath;
  let pageCount = 0;
  const collected: Match[] = [];

  while (path && pageCount < maxPages) {
    pageCount++;

    const { matches, next } = await fetchHistoryPageWithRetry(path);

    if (matches.length === 0) {
      break;
    }

    const validDates = [...new Set(matches.map(getMatchDate))].sort();

    for (const match of matches) {
      if (getMatchDate(match) === targetDate) {
        collected.push(match);
      }
    }

    if (validDates.length > 0) {
      const newestValidDate = validDates[validDates.length - 1];

      if (newestValidDate < targetDate) {
        break;
      }
    }

    path = next;
  }

  const result = collected.sort((a, b) => b.playedAtMs - a.playedAtMs);

  setCachedValue(dayCache, cacheKey, result);

  return result;
}

export async function fetchMatchesForDateRange(
  startDate: string,
  endDate: string,
  maxPages = 2000,
  startPath = "/history"
): Promise<Match[]> {
  const cacheKey = `range:${startDate}:${endDate}`;
  const cached = getCachedValue(rangeCache, cacheKey);

  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }

  let path: string | null = startPath;
  let pageCount = 0;
  const collected: Match[] = [];

  while (path && pageCount < maxPages) {
    pageCount++;

    const { matches, next } = await fetchHistoryPageWithRetry(path);

    if (matches.length === 0) {
      break;
    }

    const validDates = [...new Set(matches.map(getMatchDate))].sort();

    for (const match of matches) {
      const matchDate = getMatchDate(match);

      if (matchDate >= startDate && matchDate <= endDate) {
        collected.push(match);
      }
    }

    if (validDates.length > 0) {
      const newestValidDate = validDates[validDates.length - 1];

      if (newestValidDate < startDate) {
        break;
      }
    }

    path = next;
  }

  const result = collected.sort((a, b) => b.playedAtMs - a.playedAtMs);

  setCachedValue(rangeCache, cacheKey, result);

  return result;
}

export async function fetchMatchesForPlayer(
  playerQuery: string,
  maxPages = 200
): Promise<Match[]> {
  let path: string | null = "/history";
  let pageCount = 0;
  const collected: Match[] = [];
  const search = playerQuery.trim().toLowerCase();

  while (path && pageCount < maxPages) {
    pageCount++;

    const { matches, next } = await fetchHistoryPageWithRetry(path);

    if (matches.length === 0) {
      break;
    }

    for (const match of matches) {
      const player1 = match.player1.toLowerCase();
      const player2 = match.player2.toLowerCase();

      if (player1.includes(search) || player2.includes(search)) {
        collected.push(match);
      }
    }

    path = next;
  }

  return collected.sort((a, b) => b.playedAtMs - a.playedAtMs);
}