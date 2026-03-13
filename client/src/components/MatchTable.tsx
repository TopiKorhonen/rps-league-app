import type { Match } from "../types";

interface MatchTableProps {
  matches: Match[];
}

function MatchTable({ matches }: MatchTableProps) {
  if (matches.length === 0) {
    return <div className="status-message">No matches found.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Time (UTC)</th>
          <th>Player 1</th>
          <th>Move</th>
          <th>Player 2</th>
          <th>Move</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((match) => (
          <tr key={match.id}>
            <td>{formatUtcDateTime(match.playedAt)}</td>
            <td>{match.player1}</td>
            <td>{match.player1Move}</td>
            <td>{match.player2}</td>
            <td>{match.player2Move}</td>
            <td>
              <ResultCell match={match} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ResultCell({ match }: { match: Match }) {
  if (match.status === "TIE") {
    return <span className="badge badge-tie">Tie</span>;
  }

  if (match.status === "INVALID") {
    return <span className="badge badge-invalid">Invalid</span>;
  }

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span className="badge badge-win">Win</span>
      <span>{match.winner}</span>
    </div>
  );
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

export default MatchTable;