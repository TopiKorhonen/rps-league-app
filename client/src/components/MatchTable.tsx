import type { Match } from "../types";

interface MatchTableProps {
  matches: Match[];
}

function MatchTable({ matches }: MatchTableProps) {
  if (matches.length === 0) {
    return <p>No matches found.</p>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
      <thead>
        <tr>
          <th style={thStyle}>Time</th>
          <th style={thStyle}>Player 1</th>
          <th style={thStyle}>Move</th>
          <th style={thStyle}>Player 2</th>
          <th style={thStyle}>Move</th>
          <th style={thStyle}>Winner</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((match) => (
          <tr key={match.id}>
            <td style={tdStyle}>{formatUtcDateTime(match.playedAt)}</td>
            <td style={tdStyle}>{match.player1}</td>
            <td style={tdStyle}>{match.player1Move}</td>
            <td style={tdStyle}>{match.player2}</td>
            <td style={tdStyle}>{match.player2Move}</td>
            <td style={tdStyle}>{match.winner ?? "Draw"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  padding: "8px",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};

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