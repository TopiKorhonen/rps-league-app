import { Move } from "../types/history";

export function getWinner(
  player1: string,
  player1Move: Move,
  player2: string,
  player2Move: Move
): string | null {
  if (player1Move === player2Move) {
    return null;
  }

  const player1Wins =
    (player1Move === "ROCK" && player2Move === "SCISSORS") ||
    (player1Move === "PAPER" && player2Move === "ROCK") ||
    (player1Move === "SCISSORS" && player2Move === "PAPER");

  return player1Wins ? player1 : player2;
}