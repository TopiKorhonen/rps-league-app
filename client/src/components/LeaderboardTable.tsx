import type { LeaderboardEntry } from "../types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <p>No leaderboard data found.</p>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
      <thead>
        <tr>
          <th style={thStyle}>Rank</th>
          <th style={thStyle}>Player</th>
          <th style={thStyle}>Wins</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={entry.player}>
            <td style={tdStyle}>{index + 1}</td>
            <td style={tdStyle}>{entry.player}</td>
            <td style={tdStyle}>{entry.wins}</td>
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

export default LeaderboardTable;