/**
 * AppNavbar — shared top navigation bar used across all main pages.
 *
 * Props:
 *   title      — optional page title shown as a breadcrumb segment (string)
 *   subtitle   — optional subtitle below the title (string)
 *   backTo     — optional route to navigate to when the back chevron is clicked
 *   backLabel  — accessible label for the back button (default "Go back")
 *   actions    — optional ReactNode rendered on the right side before the user menu
 *
 * The navbar always shows:
 *   • EasyCode logo (links to /dashboard)
 *   • Optional breadcrumb: "title" segment
 *   • Nav links: Problems · Submissions (highlighted when active)
 *   • ThemeToggle
 *   • User avatar pill with username + Logout
 */

import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiCode, FiLogOut, FiList, FiFileText } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Problems",    path: "/problems",    Icon: FiList },
  { label: "Submissions", path: "/submissions", Icon: FiFileText },
];

export default function AppNavbar({ title, backTo, backLabel = "Go back", actions }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="app-nav" role="banner">
      {/* ── left cluster ──────────────────────────────────── */}
      <div className="app-nav-left">
        {/* optional back button */}
        {backTo && (
          <button
            className="app-nav-back"
            onClick={() => navigate(backTo)}
            aria-label={backLabel}
            title={backLabel}
          >
            <FiArrowLeft size={15} />
          </button>
        )}

        {/* logo — always links to dashboard */}
        <button
          className="app-nav-logo"
          onClick={() => navigate("/dashboard")}
          aria-label="EasyCode — go to dashboard"
        >
          <FiCode size={17} />
          <span>EasyCode</span>
        </button>

        {/* breadcrumb title */}
        {title && (
          <>
            <span className="app-nav-bc-sep" aria-hidden="true">›</span>
            <span className="app-nav-bc-title">{title}</span>
          </>
        )}

        {/* nav links */}
        <nav className="app-nav-links" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, path }) => {
            const active = location.pathname.startsWith(path);
            return (
              <button
                key={path}
                className={`app-nav-link${active ? " app-nav-link--active" : ""}`}
                onClick={() => navigate(path)}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── right cluster ─────────────────────────────────── */}
      <div className="app-nav-right">
        {/* page-specific actions slot */}
        {actions}

        <ThemeToggle />

        {/* user menu */}
        <div className="app-nav-user">
          <div className="app-nav-avatar" aria-hidden="true">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="app-nav-username">{user?.username}</span>
          <button
            className="app-nav-logout"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <FiLogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
