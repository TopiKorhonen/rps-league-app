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
    <div>
      <h2>Results by Player</h2>

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
          type="text"
          placeholder="Enter player name"
          value={player}
          onChange={(event) => setPlayer(event.target.value)}
        />

        <button type="submit">Search</button>
      </form>

      {!hasSearched && <p>Enter a player name to view matches.</p>}
      {loading && <p>Loading results...</p>}
      {error && <p>Error: {error}</p>}

      {!loading && !error && hasSearched && (
        <MatchTable matches={matches} />
      )}
    </div>
  );
}

export default ResultsByPlayerPage;