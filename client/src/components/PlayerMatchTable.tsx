import type { Match } from "../types";

interface PlayerMatchTableProps {
  matches: Match[];
  playerQuery: string;
}

function PlayerMatchTable({ matches, playerQuery }: PlayerMatchTableProps) {
  if (matches.length === 0) {
    return <div className="status-message">No matches found.</div>;
  }

  const normalizedQuery = playerQuery.trim().toLowerCase();

  return (
    <table>
      <thead>
        <tr>
          <th>Time (UTC)</th>
          <th>Opponent</th>
          <th>Your move</th>
          <th>Opponent move</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((match) => {
          const isPlayer1 = match.player1.toLowerCase().includes(normalizedQuery);

          const playerName = isPlayer1 ? match.player1 : match.player2;
          const opponentName = isPlayer1 ? match.player2 : match.player1;
          const playerMove = isPlayer1 ? match.player1Move : match.player2Move;
          const opponentMove = isPlayer1 ? match.player2Move : match.player1Move;

          const perspectiveResult = getPerspectiveResult(match, playerName);

          return (
            <tr key={match.id}>
              <td>{formatUtcDateTime(match.playedAt)}</td>
              <td>{opponentName}</td>
              <td>{playerMove}</td>
              <td>{opponentMove}</td>
              <td>{renderPerspectiveBadge(perspectiveResult)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function getPerspectiveResult(
  match: Match,
  playerName: string
): "WIN" | "LOSS" | "TIE" | "INVALID" {
  if (match.status === "INVALID") {
    return "INVALID";
  }

  if (match.status === "TIE") {
    return "TIE";
  }

  return match.winner === playerName ? "WIN" : "LOSS";
}

function renderPerspectiveBadge(result: "WIN" | "LOSS" | "TIE" | "INVALID") {
  if (result === "WIN") {
    return <span className="badge badge-win">Win</span>;
  }

  if (result === "LOSS") {
    return <span className="badge badge-loss">Loss</span>;
  }

  if (result === "TIE") {
    return <span className="badge badge-tie">Tie</span>;
  }

  return <span className="badge badge-invalid">Invalid</span>;
}

function formatUtcDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default PlayerMatchTable;