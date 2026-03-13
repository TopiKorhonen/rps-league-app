import { useState } from "react";
import { fetchLeaderboardByRange } from "../api/rpsApi";
import type { LeaderboardEntry } from "../types";
import LeaderboardTable from "../components/LeaderboardTable";

function LeaderboardPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!startDate || !endDate) {
      setError("Please choose both a start date and an end date.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date must be before or equal to end date.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const data = await fetchLeaderboardByRange(startDate, endDate);
      setEntries(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch leaderboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-card page-section">
      <div>
        <h2>Historical Leaderboard</h2>
        <p className="muted-text">Date range filtering uses UTC dates.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-row">
        <div className="form-field">
          <label htmlFor="startDate">Start date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="endDate">End date</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <button type="submit">Search</button>
      </form>

      {!hasSearched && (
        <div className="status-message">
          Select a date range to view leaderboard results.
        </div>
      )}

      {loading && <div className="status-message">Loading leaderboard...</div>}
      {error && <div className="status-message">Error: {error}</div>}

      {!loading && !error && hasSearched && (
        <>
          <div className="muted-text">
            Showing leaderboard for {startDate} to {endDate}.
          </div>
          <LeaderboardTable entries={entries} />
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;