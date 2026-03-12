import { Link, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ResultsByDayPage from "./pages/ResultsByDayPage";
import ResultsByPlayerPage from "./pages/ResultsByPlayerPage";
import LeaderboardPage from "./pages/LeaderboardPage";

function App() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>RPS League</h1>

      <nav style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Link to="/">Dashboard</Link>
        <Link to="/results/day">Results by Day</Link>
        <Link to="/results/player">Results by Player</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/results/day" element={<ResultsByDayPage />} />
        <Route path="/results/player" element={<ResultsByPlayerPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </div>
  );
}

export default App;