import { useState } from "react";
import { fetchResultsByPlayer } from "../api/rpsApi";
import type { Match } from "../types";
import MatchTable from "../components/MatchTable";

function ResultsByPlayerPage() {
  const [player, setPlayer] = useState("");
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

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const data = await fetchResultsByPlayer(player.trim());
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
        <h2>Results by Player</h2>
        <p className="muted-text">
          Search for a full or partial player name.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-row">
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

        <button type="submit">Search</button>
      </form>

      {!hasSearched && (
        <div className="status-message">
          Enter a player name to view match results.
        </div>
      )}

      {loading && <div className="status-message">Loading results...</div>}
      {error && <div className="status-message">Error: {error}</div>}
      {!loading && !error && hasSearched && <MatchTable matches={matches} />}
    </div>
  );
}

export default ResultsByPlayerPage;