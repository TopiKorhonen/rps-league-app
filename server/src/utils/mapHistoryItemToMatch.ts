import { RawHistoryItem, Match } from "../types/history";
import { getWinner } from "./getWinner";

export function mapHistoryItemToMatch(item: RawHistoryItem): Match {
  const winner = getWinner(
    item.playerA.name,
    item.playerA.played,
    item.playerB.name,
    item.playerB.played
  );

  return {
    id: item.gameId,
    playedAt: new Date(item.time).toISOString(),
    playedAtMs: item.time,
    player1: item.playerA.name,
    player2: item.playerB.name,
    player1Move: item.playerA.played,
    player2Move: item.playerB.played,
    winner,
  };
}