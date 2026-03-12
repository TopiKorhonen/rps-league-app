import type { Match } from "../types/history";

export interface LeaderboardEntry {
  player: string;
  wins: number;
}

export function buildLeaderboard(matches: Match[]): LeaderboardEntry[] {
  const winCounts: Record<string, number> = {};

  for (const match of matches) {
    if (match.status !== "WIN" || !match.winner) {
      continue;
    }

    if (!winCounts[match.winner]) {
      winCounts[match.winner] = 0;
    }

    winCounts[match.winner]++;
  }

  return Object.entries(winCounts)
    .map(([player, wins]) => ({ player, wins }))
    .sort((a, b) => b.wins - a.wins || a.player.localeCompare(b.player));
}