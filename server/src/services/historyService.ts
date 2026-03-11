import { rpsApi } from "./rpsApi";
import { RawHistoryItem, Match } from "../types/history";
import { mapHistoryItemToMatch } from "../utils/mapHistoryItemToMatch";

interface HistoryResponse {
  data: RawHistoryItem[];
  next?: string | null;
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
    next: response.data.next ?? null,
  };
}

export async function fetchHistoryPages(maxPages = 5): Promise<Match[]> {
  let path: string | null = "/history";
  let pageCount = 0;
  const allMatches: Match[] = [];

  while (path && pageCount < maxPages) {
    const { matches, next } = await fetchHistoryPage(path);

    allMatches.push(...matches);
    path = next;
    pageCount++;
  }

  return allMatches;
}