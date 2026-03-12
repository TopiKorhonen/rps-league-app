// Normalize legacy API move values and determine match status.
// Valid move beats invalid move, equal valid moves are ties,
// and two invalid moves produce an INVALID result.

import type { MatchStatus, ValidMove } from "../types/history";
import { normalizeMove } from "./normalizeMove";

interface MatchOutcome {
  normalizedPlayer1Move: ValidMove | null;
  normalizedPlayer2Move: ValidMove | null;
  winner: string | null;
  status: MatchStatus;
}

export function getMatchOutcome(
  player1: string,
  player1MoveRaw: string,
  player2: string,
  player2MoveRaw: string
): MatchOutcome {
  const player1Move = normalizeMove(player1MoveRaw);
  const player2Move = normalizeMove(player2MoveRaw);

  if (!player1Move && !player2Move) {
    return {
      normalizedPlayer1Move: null,
      normalizedPlayer2Move: null,
      winner: null,
      status: "INVALID",
    };
  }

  if (player1Move && !player2Move) {
    return {
      normalizedPlayer1Move: player1Move,
      normalizedPlayer2Move: null,
      winner: player1,
      status: "WIN",
    };
  }

  if (!player1Move && player2Move) {
    return {
      normalizedPlayer1Move: null,
      normalizedPlayer2Move: player2Move,
      winner: player2,
      status: "WIN",
    };
  }

  if (player1Move === player2Move) {
    return {
      normalizedPlayer1Move: player1Move,
      normalizedPlayer2Move: player2Move,
      winner: null,
      status: "TIE",
    };
  }

  const player1Wins =
    (player1Move === "ROCK" && player2Move === "SCISSORS") ||
    (player1Move === "PAPER" && player2Move === "ROCK") ||
    (player1Move === "SCISSORS" && player2Move === "PAPER");

  return {
    normalizedPlayer1Move: player1Move,
    normalizedPlayer2Move: player2Move,
    winner: player1Wins ? player1 : player2,
    status: "WIN",
  };
}