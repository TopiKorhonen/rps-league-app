export type ValidMove = "ROCK" | "PAPER" | "SCISSORS";
export type MatchStatus = "WIN" | "TIE" | "INVALID";

export interface RawHistoryItem {
  type: string;
  gameId: string;
  time: number;
  playerA: {
    name: string;
    played: string;
  };
  playerB: {
    name: string;
    played: string;
  };
}

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