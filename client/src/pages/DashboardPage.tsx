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

        setLatestMatches(matchesData.slice(0, 30));
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
            .slice(0, 30);
        });
      } catch {
        // ignore malformed events
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
    <div className="dashboard-layout">
      <section className="live-banner">
        <div className="live-banner-left">
          <h2>Live feed</h2>
        </div>

        <div className="live-banner-center">
          <p>
            If live updates are available, current live match results will appear here
            and update automatically.
          </p>
        </div>

        <div className="live-banner-right">
          <div className="live-pill">
            <span
              className={`live-dot ${
                liveStatus === "connected"
                  ? "live-dot-connected"
                  : liveStatus === "reconnecting"
                  ? "live-dot-reconnecting"
                  : "live-dot-connecting"
              }`}
            />
            {liveStatus === "connected"
              ? "Live connected"
              : liveStatus === "reconnecting"
              ? "Live reconnecting"
              : "Live connecting"}
          </div>
        </div>
      </section>

      {error && <div className="status-message">Error: {error}</div>}

      <div className="dashboard-panels">
        <section className="page-card page-section dashboard-card">
          <div>
            <h2>Latest match results</h2>
            <p className="muted-text">
              Newest results first. Times are shown in UTC.
            </p>
          </div>

          {loading ? (
            <div className="status-message">Loading latest results...</div>
          ) : (
            <div className="scroll-panel tall-scroll-panel">
              <MatchTable matches={latestMatches} />
            </div>
          )}
        </section>

        <section className="page-card page-section dashboard-card">
          <div>
            <h2>Today's leaderboard</h2>
            <p className="muted-text">Ranked by number of wins today.</p>
          </div>

          {loading ? (
            <div className="status-message">Loading leaderboard...</div>
          ) : (
            <div className="scroll-panel tall-scroll-panel">
              <LeaderboardTable entries={leaderboard} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;