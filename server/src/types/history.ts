export type Move = "ROCK" | "PAPER" | "SCISSORS"; 

export interface RawHistoryItem {
  type: string;
  gameId: string;
  time: number;
  playerA: {
    name: string;
    played: Move;
  };
  playerB: {
    name: string;
    played: Move;
  };
}

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