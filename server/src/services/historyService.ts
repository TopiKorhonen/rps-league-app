import { rpsApi } from "./rpsApi";
import type { RawHistoryItem, Match } from "../types/history";
import { mapHistoryItemToMatch } from "../utils/mapHistoryItemToMatch";
import { getMatchDate } from "../utils/getMatchDate";
import { isValidMatchDate } from "../utils/isValidMatchDate";

const dateQueryCache = new Map<string, Match[]>();

let lastLegacyApiRequestAt = 0;

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

export async function fetchMatchesForDate(
  targetDate: string,
  maxPages = 2000,
  startPath = "/history"
): Promise<Match[]> {
  const cacheKey = `${targetDate}|${startPath}`;

  const cached = dateQueryCache.get(cacheKey);
  if (cached) {
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
  dateQueryCache.set(cacheKey, result);

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

export async function fetchMatchesForDateRange(
  startDate: string,
  endDate: string,
  maxPages = 2000,
  startPath = "/history"
): Promise<Match[]> {
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

  return collected.sort((a, b) => b.playedAtMs - a.playedAtMs);
}

export interface DateSearchPageMeta {
  page: number;
  path: string;
  elapsedMs: number;
  validMatchCount: number;
  validDates: string[];
  oldestValidDate: string | null;
  newestValidDate: string | null;
  targetHits: number;
  next: string | null;
}

export interface DateSearchMeta {
  targetDate: string;
  pagesVisited: number;
  totalMatchesCollected: number;
  reachedTargetWindow: boolean;
  reachedMaxPages: boolean;
  reachedMaxDuration: boolean;
  repeatedCursorDetected: boolean;
  stopReason:
    | "NO_MORE_CURSOR"
    | "NO_MATCHES_ON_PAGE"
    | "ALL_VALID_DATES_OLDER_THAN_TARGET"
    | "MAX_PAGES_REACHED"
    | "MAX_DURATION_REACHED"
    | "REPEATED_CURSOR"
    | "UNKNOWN";
  totalElapsedMs: number;
  pageSummaries: DateSearchPageMeta[];
}

export interface DateSearchResult {
  matches: Match[];
  meta: DateSearchMeta;
}

export async function fetchMatchesForDateDebug(
  targetDate: string,
  options?: {
    maxPages?: number;
    maxDurationMs?: number;
    startPath?: string;
  }
): Promise<DateSearchResult> {
  const maxPages = options?.maxPages ?? 2000;
  const maxDurationMs = options?.maxDurationMs ?? 30000;

  let path: string | null = options?.startPath ?? "/history";
  let pageCount = 0;
  const collected: Match[] = [];
  const pageSummaries: DateSearchPageMeta[] = [];
  const seenPaths = new Set<string>();
  const startedAt = Date.now();

  let reachedTargetWindow = false;
  let reachedMaxPages = false;
  let reachedMaxDuration = false;
  let repeatedCursorDetected = false;

  let stopReason: DateSearchMeta["stopReason"] = "UNKNOWN";

  while (path) {
    const totalElapsedMs = Date.now() - startedAt;

    if (pageCount >= maxPages) {
      reachedMaxPages = true;
      stopReason = "MAX_PAGES_REACHED";
      break;
    }

    if (totalElapsedMs >= maxDurationMs) {
      reachedMaxDuration = true;
      stopReason = "MAX_DURATION_REACHED";
      break;
    }

    if (seenPaths.has(path)) {
      repeatedCursorDetected = true;
      stopReason = "REPEATED_CURSOR";
      break;
    }

    seenPaths.add(path);
    pageCount++;

    const pageStartedAt = Date.now();
    const { matches, next } = await fetchHistoryPageWithRetry(path);
    const elapsedMs = Date.now() - pageStartedAt;

    if (matches.length === 0) {
      stopReason = "NO_MATCHES_ON_PAGE";
      break;
    }

    const validDates = [...new Set(matches.map(getMatchDate))].sort();
    const oldestValidDate = validDates.length > 0 ? validDates[0] : null;
    const newestValidDate =
      validDates.length > 0 ? validDates[validDates.length - 1] : null;

    const targetMatches = matches.filter(
      (match) => getMatchDate(match) === targetDate
    );

    if (targetMatches.length > 0) {
      reachedTargetWindow = true;
      collected.push(...targetMatches);
    }

    pageSummaries.push({
      page: pageCount,
      path,
      elapsedMs,
      validMatchCount: matches.length,
      validDates,
      oldestValidDate,
      newestValidDate,
      targetHits: targetMatches.length,
      next,
    });

    if (newestValidDate && newestValidDate < targetDate) {
      stopReason = "ALL_VALID_DATES_OLDER_THAN_TARGET";
      break;
    }

    if (!next) {
      stopReason = "NO_MORE_CURSOR";
      break;
    }

    path = next;
  }

  const totalElapsedMs = Date.now() - startedAt;

  return {
    matches: collected.sort((a, b) => b.playedAtMs - a.playedAtMs),
    meta: {
      targetDate,
      pagesVisited: pageCount,
      totalMatchesCollected: collected.length,
      reachedTargetWindow,
      reachedMaxPages,
      reachedMaxDuration,
      repeatedCursorDetected,
      stopReason,
      totalElapsedMs,
      pageSummaries,
    },
  };
}

export interface HistoryDepthMeta {
  pagesVisited: number;
  totalValidMatchesSeen: number;
  oldestValidDateSeen: string | null;
  newestValidDateSeen: string | null;
  completed: boolean;
  reachedMaxPages: boolean;
  reachedMaxDuration: boolean;
  repeatedCursorDetected: boolean;
  stopReason:
    | "NO_MORE_CURSOR"
    | "NO_MATCHES_ON_PAGE"
    | "MAX_PAGES_REACHED"
    | "MAX_DURATION_REACHED"
    | "REPEATED_CURSOR"
    | "UNKNOWN";
  totalElapsedMs: number;
}

export async function inspectHistoryDepth(options?: {
  maxPages?: number;
  maxDurationMs?: number;
}): Promise<HistoryDepthMeta> {
  const maxPages = options?.maxPages ?? 5000;
  const maxDurationMs = options?.maxDurationMs ?? 120000;

  let path: string | null = "/history";
  let pageCount = 0;
  let totalValidMatchesSeen = 0;
  let oldestValidDateSeen: string | null = null;
  let newestValidDateSeen: string | null = null;
  let reachedMaxPages = false;
  let reachedMaxDuration = false;
  let repeatedCursorDetected = false;
  let stopReason: HistoryDepthMeta["stopReason"] = "UNKNOWN";

  const seenPaths = new Set<string>();
  const startedAt = Date.now();

  while (path) {
    const elapsed = Date.now() - startedAt;

    if (pageCount >= maxPages) {
      reachedMaxPages = true;
      stopReason = "MAX_PAGES_REACHED";
      break;
    }

    if (elapsed >= maxDurationMs) {
      reachedMaxDuration = true;
      stopReason = "MAX_DURATION_REACHED";
      break;
    }

    if (seenPaths.has(path)) {
      repeatedCursorDetected = true;
      stopReason = "REPEATED_CURSOR";
      break;
    }

    seenPaths.add(path);
    pageCount++;

    const { matches, next } = await fetchHistoryPageWithRetry(path);

    if (matches.length === 0) {
      stopReason = "NO_MATCHES_ON_PAGE";
      break;
    }

    totalValidMatchesSeen += matches.length;

    const validDates = [...new Set(matches.map(getMatchDate))].sort();

    if (validDates.length > 0) {
      const pageOldest = validDates[0];
      const pageNewest = validDates[validDates.length - 1];

      if (!oldestValidDateSeen || pageOldest < oldestValidDateSeen) {
        oldestValidDateSeen = pageOldest;
      }

      if (!newestValidDateSeen || pageNewest > newestValidDateSeen) {
        newestValidDateSeen = pageNewest;
      }
    }

    if (!next) {
      stopReason = "NO_MORE_CURSOR";
      path = null;
      break;
    }

    path = next;
  }

  return {
    pagesVisited: pageCount,
    totalValidMatchesSeen,
    oldestValidDateSeen,
    newestValidDateSeen,
    completed: stopReason === "NO_MORE_CURSOR",
    reachedMaxPages,
    reachedMaxDuration,
    repeatedCursorDetected,
    stopReason,
    totalElapsedMs: Date.now() - startedAt,
  };
}