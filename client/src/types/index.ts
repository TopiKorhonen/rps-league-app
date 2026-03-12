export type MatchStatus = "WIN" | "TIE" | "INVALID";

export interface Match {
  id: string;
  playedAt: string;
  playedAtMs: number;
  player1: string;
  player2: string;
  player1Move: string;
  player2Move: string;
  winner: string | null;
  status: MatchStatus;
}

export interface LeaderboardEntry {
  player: string;
  wins: number;
}