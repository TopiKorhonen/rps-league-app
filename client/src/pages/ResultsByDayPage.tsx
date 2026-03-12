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
        setError(err.message || "Failed to fetch results");
      } else {
        setError("Failed to fetch results");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Results by Day</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {!hasSearched && <p>Select a date to view match results.</p>}
      {loading && <p>Loading results...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && hasSearched && <MatchTable matches={matches} />}
    </div>
  );
}

export default ResultsByDayPage;