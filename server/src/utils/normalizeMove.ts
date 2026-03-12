import type { ValidMove } from "../types/history";

export function normalizeMove(move: string): ValidMove | null {
  const normalized = move.trim().toUpperCase();

  if (
    normalized === "ROCK" ||
    normalized === "PAPER" ||
    normalized === "SCISSORS"
  ) {
    return normalized;
  }

  return null;
}