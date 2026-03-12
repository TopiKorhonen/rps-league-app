import { rpsApi } from "./rpsApi";
import { RawHistoryItem, Match } from "../types/history";
import { mapHistoryItemToMatch } from "../utils/mapHistoryItemToMatch";
import { getMatchDate } from "../utils/getMatchDate";

interface HistoryResponse {
  data: RawHistoryItem[];
  cursor?: string | null;
}

export async function fetchHistoryPage(path = "/history"): Promise<{
  matches: Match[];
  next: string | null;
}> {
  const response = await rpsApi.get<HistoryResponse>(path);

  const rawItems = response.data.data ?? [];

  const matches = rawItems
    .filter((item) => item.type === "GAME_RESULT")
    .map(mapHistoryItemToMatch);

  return {
    matches,
    next: response.data.cursor ?? null,
  };
}

export async function fetchHistoryPages(maxPages = 5): Promise<Match[]> {
  let path: string | null = "/history";
  let pageCount = 0;
  const allMatches: Match[] = [];

  while (path && pageCount < maxPages) {
    console.log(`Fetching page ${pageCount + 1} with path: ${path}`);

    const { matches, next } = await fetchHistoryPage(path);

    if (matches.length > 0) {
      const pageDates = [...new Set(matches.map(getMatchDate))].sort();
      console.log(`Page ${pageCount + 1} dates:`, pageDates);
    }

    console.log(`Next after page ${pageCount + 1}:`, next);

    allMatches.push(...matches);
    path = next;
    pageCount++;
  }

  return allMatches;
}

export async function fetchMatchesForDate(
  targetDate: string,
  maxPages = 100
): Promise<Match[]> {
  let path: string | null = "/history";
  let pageCount = 0;
  const collected: Match[] = [];

  while (path && pageCount < maxPages) {
    pageCount++;

    const { matches, next } = await fetchHistoryPage(path);

    if (matches.length === 0) {
      break;
    }

    const pageDates = [...new Set(matches.map(getMatchDate))].sort();
    const validPageDates = pageDates.filter(
      (date) => date >= "2025-01-01" && date <= "2100-01-01"
    );

    console.log(`Page ${pageCount} dates:`, pageDates);

    for (const match of matches) {
      if (getMatchDate(match) === targetDate) {
        collected.push(match);
      }
    }

    if (validPageDates.length > 0) {
      const newestValidDate = validPageDates.reduce((a, b) => (a > b ? a : b));

      if (newestValidDate < targetDate) {
        console.log(`Stopping: all valid dates are older than ${targetDate}`);
        break;
      }
    }

    path = next;
  }

  if (pageCount === maxPages) {
    console.warn(`Reached maxPages=${maxPages} while searching for ${targetDate}`);
  }

  return collected;
}

export async function fetchMatchesForPlayer(
  playerQuery: string,
  maxPages = 100
): Promise<Match[]> {
  let path: string | null = "/history";
  let pageCount = 0;
  const collected: Match[] = [];
  const search = playerQuery.trim().toLowerCase();

  while (path && pageCount < maxPages) {
    pageCount++;

    const { matches, next } = await fetchHistoryPage(path);

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

  if (pageCount === maxPages) {
    console.warn(`Reached maxPages=${maxPages} while searching for player ${playerQuery}`);
  }

  return collected;
}

export async function fetchMatchesForDateRange(
  startDate: string,
  endDate: string,
  maxPages = 2000
): Promise<Match[]> {
  let path: string | null = "/history";
  let pageCount = 0;
  const collected: Match[] = [];

  while (path && pageCount < maxPages) {
    pageCount++;

    const { matches, next } = await fetchHistoryPage(path);

    if (matches.length === 0) {
      break;
    }

    const pageDates = [...new Set(matches.map(getMatchDate))].sort();
    const validPageDates = pageDates.filter(
      (date) => date >= "2025-01-01" && date <= "2100-01-01"
    );

    for (const match of matches) {
      const matchDate = getMatchDate(match);

      if (matchDate >= startDate && matchDate <= endDate) {
        collected.push(match);
      }
    }

    if (validPageDates.length > 0) {
      const newestValidDate = validPageDates.reduce((a, b) => (a > b ? a : b));

      if (newestValidDate < startDate) {
        console.log(`Stopping: all valid dates are older than start date ${startDate}`);
        break;
      }
    }

    path = next;
  }

  if (pageCount === maxPages) {
    console.warn(
      `Reached maxPages=${maxPages} while searching range ${startDate} to ${endDate}`
    );
  }

  return collected;
}