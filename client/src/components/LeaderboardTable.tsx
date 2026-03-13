import type { LeaderboardEntry } from "../types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <div className="status-message">No leaderboard data found.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Wins</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={entry.player}>
            <td>{index + 1}</td>
            <td>{entry.player}</td>
            <td>{entry.wins}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default LeaderboardTable;