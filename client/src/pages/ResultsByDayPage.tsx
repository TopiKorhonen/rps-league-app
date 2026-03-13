import { useState } from "react";
import { fetchResultsByDay } from "../api/rpsApi";
import type { Match } from "../types";
import MatchTable from "../components/MatchTable";

function ResultsByDayPage() {
  const [date, setDate] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!date) {
      setError("Please choose a date.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const data = await fetchResultsByDay(date);
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

  return (
    <div className="page-card page-section">
      <div>
        <h2>Results by Day</h2>
        <p className="muted-text">Date filtering and times use UTC.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-row">
        <div className="form-field">
          <label htmlFor="day">Date</label>
          <input
            id="day"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <button type="submit">Search</button>
      </form>

      {!hasSearched && (
        <div className="status-message">
          Select a date to view match results.
        </div>
      )}

      {loading && <div className="status-message">Loading results...</div>}
      {error && <div className="status-message">Error: {error}</div>}
      {!loading && !error && hasSearched && <MatchTable matches={matches} />}
    </div>
  );
}

export default ResultsByDayPage;