import { Match } from "../types/history";

export function getMatchDate(match: Match): string {
  return match.playedAt.slice(0, 10);
}