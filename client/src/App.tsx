import { Link, Route, Routes, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ResultsByDayPage from "./pages/ResultsByDayPage";
import ResultsByPlayerPage from "./pages/ResultsByPlayerPage";
import LeaderboardPage from "./pages/LeaderboardPage";

function App() {
  const location = useLocation();

  return (
    <div className="page-shell">
      <header className="app-header">
        <div className="app-header-top">
          <div className="app-title-block">
            <h1 className="app-title">RPS League</h1>
            <p className="app-subtitle">
              Live results, player history, and leaderboard standings.
            </p>
          </div>
        </div>

        <nav className="top-nav">
          <NavLink to="/" label="Dashboard" currentPath={location.pathname} />
          <NavLink
            to="/results/day"
            label="Results by Day"
            currentPath={location.pathname}
          />
          <NavLink
            to="/results/player"
            label="Results by Player"
            currentPath={location.pathname}
          />
          <NavLink
            to="/leaderboard"
            label="Leaderboard"
            currentPath={location.pathname}
          />
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/results/day" element={<ResultsByDayPage />} />
        <Route path="/results/player" element={<ResultsByPlayerPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  label: string;
  currentPath: string;
}

function NavLink({ to, label, currentPath }: NavLinkProps) {
  const isActive = currentPath === to;

  return (
    <Link
      to={to}
      style={{
        fontWeight: isActive ? 800 : 500,
        background: isActive ? "#ffffff" : undefined,
        borderColor: isActive ? "#475569" : undefined,
      }}
    >
      {label}
    </Link>
  );
}

export default App;