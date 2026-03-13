import { Link, Route, Routes, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ResultsByDayPage from "./pages/ResultsByDayPage";
import ResultsByPlayerPage from "./pages/ResultsByPlayerPage";
import LeaderboardPage from "./pages/LeaderboardPage";

function App() {
  const location = useLocation();

  return (
    <div className="page-shell">
      <header>
        <h1>RPS League</h1>
        <p className="muted-text">
          Match results and leaderboards powered by the legacy RPS API.
        </p>

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
        fontWeight: isActive ? 700 : 500,
        borderColor: isActive ? "#9ca3af" : undefined,
      }}
    >
      {label}
    </Link>
  );
}

export default App;