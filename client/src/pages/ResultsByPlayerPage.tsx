import { useState } from "react";
import { fetchResultsByPlayer } from "../api/rpsApi";
import type { Match } from "../types";
import PlayerMatchTable from "../components/PlayerMatchTable";

function ResultsByPlayerPage() {
  const [player, setPlayer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!player.trim()) {
      setError("Please enter a player name.");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError("Start date must be before or equal to end date.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const data = await fetchResultsByPlayer(
        player.trim(),
        startDate || undefined,
        endDate || undefined
      );

      setMatches(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch results");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClearDates() {
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="page-card page-section">
      <div>
        <h2>Results by Player</h2>
        <p className="muted-text">
          Search by player name. Leave dates empty to search recent results only,
          or add a date range for a more targeted historical search.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="page-section">
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="player">Player name</label>
            <input
              id="player"
              type="text"
              placeholder="e.g. Elena"
              value={player}
              onChange={(event) => setPlayer(event.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="playerStartDate">Start date</label>
            <input
              id="playerStartDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="playerEndDate">End date</label>
            <input
              id="playerEndDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>

          <button type="button" onClick={handleClearDates} disabled={loading}>
            Clear dates
          </button>
        </div>
      </form>

      {!hasSearched && (
        <div className="status-message">
          Enter a player name to view results. Add dates to narrow the search.
        </div>
      )}

      {loading && <div className="status-message">Loading results...</div>}
      {error && <div className="status-message">Error: {error}</div>}
      {!loading && !error && hasSearched && (<PlayerMatchTable matches={matches} playerQuery={player} />)}
    </div>
  );
}

export default ResultsByPlayerPage;