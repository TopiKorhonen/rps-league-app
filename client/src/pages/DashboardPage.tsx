import { useEffect, useState } from "react";
import { fetchLatestResults, fetchTodayLeaderboard } from "../api/rpsApi";
import type { Match, LeaderboardEntry } from "../types";
import MatchTable from "../components/MatchTable";
import LeaderboardTable from "../components/LeaderboardTable";

function DashboardPage() {
  const [latestMatches, setLatestMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [matchesData, leaderboardData] = await Promise.all([
          fetchLatestResults(),
          fetchTodayLeaderboard(),
        ]);

        setLatestMatches(matchesData);
        setLeaderboard(leaderboardData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load dashboard");
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="page-grid">
      <section className="page-card page-section">
        <div>
          <h2>Latest Match Results</h2>
          <p className="muted-text">Times are shown in UTC.</p>
        </div>

        {loading && <div className="status-message">Loading dashboard...</div>}
        {error && <div className="status-message">Error: {error}</div>}
        {!loading && !error && <MatchTable matches={latestMatches} />}
      </section>

      <section className="page-card page-section">
        <div>
          <h2>Today's Leaderboard</h2>
          <p className="muted-text">Ranked by number of wins today.</p>
        </div>

        {loading && <div className="status-message">Loading leaderboard...</div>}
        {error && <div className="status-message">Error: {error}</div>}
        {!loading && !error && <LeaderboardTable entries={leaderboard} />}
      </section>
    </div>
  );
}

export default DashboardPage;