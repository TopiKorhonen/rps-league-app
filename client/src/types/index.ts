export type Move = "ROCK" | "PAPER" | "SCISSORS";

export interface Match {
  id: string;
  playedAt: string;
  playedAtMs: number;
  player1: string;
  player2: string;
  player1Move: Move;
  player2Move: Move;
  winner: string | null;
}

export interface LeaderboardEntry {
  player: string;
  wins: number;
}