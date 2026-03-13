import { useEffect, useRef, useState } from "react";
import { fetchLatestResults, fetchTodayLeaderboard } from "../api/rpsApi";
import type { Match, LeaderboardEntry } from "../types";
import MatchTable from "../components/MatchTable";
import LeaderboardTable from "../components/LeaderboardTable";

function DashboardPage() {
  const [latestMatches, setLatestMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<
    "connecting" | "connected" | "reconnecting"
  >("connecting");

  const reconnectTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:4000/api/live");

    eventSource.onopen = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      setLiveStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const incomingMatch: Match = JSON.parse(event.data);

        setLatestMatches((current) => {
          const withoutDuplicate = current.filter(
            (match) => match.id !== incomingMatch.id
          );

          return [incomingMatch, ...withoutDuplicate]
            .sort((a, b) => b.playedAtMs - a.playedAtMs)
            .slice(0, 20);
        });
      } catch {
        // Ignore malformed live events
      }
    };

    eventSource.onerror = () => {
      if (reconnectTimerRef.current === null) {
        reconnectTimerRef.current = window.setTimeout(() => {
          setLiveStatus("reconnecting");
          reconnectTimerRef.current = null;
        }, 2000);
      }
    };

    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      eventSource.close();
    };
  }, []);

  return (
    <div className="page-grid">
      <section className="page-card page-section">
        <div>
          <h2>Latest Match Results</h2>
          <p className="muted-text">Times are shown in UTC.</p>
          <p className="muted-text">
            Live updates:{" "}
            {liveStatus === "connected"
              ? "Connected"
              : liveStatus === "reconnecting"
              ? "Reconnecting"
              : "Connecting"}
          </p>
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