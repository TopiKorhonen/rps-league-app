import type { Match } from "../types/history";
import { getMatchOutcome } from "./getMatchOutcome";

interface RawLiveItem {
  type?: string;
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

export function mapLiveItemToMatch(item: RawLiveItem): Match {
  const outcome = getMatchOutcome(
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
    player1Move: outcome.normalizedPlayer1Move ?? item.playerA.played,
    player2Move: outcome.normalizedPlayer2Move ?? item.playerB.played,
    winner: outcome.winner,
    status: outcome.status,
  };
}