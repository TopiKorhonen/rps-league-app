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
      } catch (err: unknown){
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load dashboard data");
        }
      }finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div style={{ display: "grid", gap: "32px" }}>
      <section>
        <h2>Latest Match Results</h2>
        <MatchTable matches={latestMatches} />
      </section>

      <section>
        <h2>Today's Leaderboard</h2>
        <LeaderboardTable entries={leaderboard} />
      </section>
    </div>
  );
}

export default DashboardPage;