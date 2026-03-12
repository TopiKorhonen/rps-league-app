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
    <div>
      <h2>Historical Leaderboard</h2>
      <p style={{ marginBottom: "12px" }}>
        Date range filtering is based on UTC dates.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <label>
          Start date{" "}
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <label>
          End date{" "}
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>

        <button type="submit">Search</button>
      </form>

      {!hasSearched && <p>Select a date range to view leaderboard results.</p>}
      {loading && <p>Loading leaderboard...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && hasSearched && (
        <>
            <p>
            Showing leaderboard for {startDate} to {endDate} (UTC)
            </p>
            <LeaderboardTable entries={entries} />
        </>
        )}
    </div>
  );
}

export default LeaderboardPage;