import type { Match } from "../types/history";

export function isValidMatchDate(match: Match): boolean {
  const date = match.playedAt.slice(0, 10);
  return date >= "2025-01-01" && date <= "2100-01-01";
}