import { Match } from "../types/history";

export function sortMatchesNewestFirst(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => b.playedAtMs - a.playedAtMs);
}