import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { getAllProblems, createProblem } from "../services/problem";
import { getMySubmissions } from "../services/submission";
import { getPlatformStats } from "../services/admin";
import ProblemModal from "../components/ProblemModal";

import {
  FiList,
  FiPlusSquare,
  FiCheckCircle,
  FiCalendar,
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import AppNavbar from "../components/AppNavbar";

/* ── helpers ─────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatJoined(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── sub-components ──────────────────────────────────────── */

function StatCard({ icon, label, value, accent, onClick, isClickable = false }) {
  const CardComponent = isClickable ? "button" : "div";
  
  const handleKeyDown = (e) => {
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <CardComponent 
      className={`db-stat-card ${isClickable ? "db-stat-card--clickable" : ""}`}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div
        className="db-stat-icon"
        style={accent ? { color: "var(--accent)" } : {}}
      >
        {icon}
      </div>
      <div className="db-stat-body">
        <span className="db-stat-label">{label}</span>
        <span className="db-stat-value">{value}</span>
      </div>
      <div className="db-stat-accent-bar" />
    </CardComponent>
  );
}

/* ── main component ──────────────────────────────────────── */

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const [totalProblems, setTotalProblems] = useState(null);
  const [totalSubmissions, setTotalSubmissions] = useState(null);

  // Platform-wide stats — only fetched for admins
  const [platformUsers, setPlatformUsers] = useState(null);
  const [platformSubmissions, setPlatformSubmissions] = useState(null);

  /* ── inline create-problem modal ─────────────────────── */
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* ── fetch stats on mount ─────────────────────────────── */
  useEffect(() => {
    if (isAdmin) {
      // For admins: get all stats from the consolidated admin endpoint
      getPlatformStats()
        .then((res) => {
          const stats = res.data.stats;
          setPlatformUsers(stats?.totalUsers ?? "—");
          setPlatformSubmissions(stats?.totalSubmissions ?? "—");
          setTotalProblems(stats?.totalProblems ?? "—");
        })
        .catch(() => {
          setPlatformUsers("—");
          setPlatformSubmissions("—");
          setTotalProblems("—");
        });
    } else {
      // For regular users: fetch problems separately
      getAllProblems()
        .then((res) => setTotalProblems(res.data.count ?? res.data.problems?.length ?? 0))
        .catch(() => setTotalProblems("—"));
    }

    // Always fetch user's own submissions
    getMySubmissions(1, 1)
      .then((res) => setTotalSubmissions(res.data.pagination?.total ?? 0))
      .catch(() => setTotalSubmissions("—"));
  }, [isAdmin]);

  /* ── inline create-problem handler ───────────────────── */
  const handleCreateModalSave = async ({ mode, problemData }) => {
    // Dashboard only ever opens the modal in "create" mode
    const res = await createProblem(problemData);
    toast.success("Problem created successfully.");
    // Refresh problem count
    setTotalProblems((prev) =>
      typeof prev === "number" ? prev + 1 : prev
    );
    return res.data.problem;
  };

  /* ── stats definition ─────────────────────────────────── */
  // Only real, database-backed values. No placeholders, no fakes.
  const stats = [
    {
      icon: <FiList size={20} />,
      label: "Total Problems",
      value: totalProblems === null ? "…" : totalProblems,
      accent: true,
      isClickable: isAdmin,
      onClick: isAdmin ? () => navigate("/problems") : undefined,
    },
    {
      icon: <FiCheckCircle size={20} />,
      label: "My Submissions", 
      value: totalSubmissions === null ? "…" : totalSubmissions,
      isClickable: true,
      onClick: () => navigate("/submissions"),
    },
    {
      icon: <FiCalendar size={20} />,
      label: "Joined",
      value: formatJoined(user?.createdAt),
      isClickable: false,
    },
  ];

  /* ── platform overview stats for admins ──────────────── */
  const platformStats = isAdmin ? [
    {
      icon: <FiUsers size={20} />,
      label: "Registered Users",
      value: platformUsers === null ? "…" : platformUsers,
      isClickable: true,
      onClick: () => navigate("/users"),
    },
    {
      icon: <FiActivity size={20} />,
      label: "Total Submissions",
      value: platformSubmissions === null ? "…" : platformSubmissions,
      isClickable: false,
    },
  ] : [];

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="db-page">
      {/* ── shared app navbar ──────────────────────────────── */}
      <AppNavbar />

      <main className="db-main">
        {/* ── hero ────────────────────────────────────────── */}
        <section className="db-hero">
          <div>
            <p className="db-greeting">{getGreeting()},</p>
            <h1 className="db-username">{user?.username ?? "—"}</h1>
            <p className="db-subtitle">
              {isAdmin
                ? "Manage problems, test cases, and submissions."
                : "Ready to solve today?"}
            </p>
          </div>
          {isAdmin && <span className="db-role-badge">Admin</span>}
        </section>

        {/* ── platform overview (admin only) ─────────────── */}
        {isAdmin && (
          <section className="db-section">
            <h2 className="db-section-title">Platform Overview</h2>
            <div className="db-stats-grid">
              {platformStats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </section>
        )}

        {/* ── overview stats ──────────────────────────────── */}
        <section className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Overview</h2>
            {isAdmin && (
              <button 
                className="db-create-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlusSquare size={16} />
                Create Problem
              </button>
            )}
          </div>
          <div className="db-stats-grid">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* ── account ─────────────────────────────────────── */}
        <section className="db-section">
          <h2 className="db-section-title">Account</h2>
          <div className="db-account-card">
            <div className="db-account-avatar">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="db-account-details">
              <span className="db-account-name">{user?.username}</span>
              <span className="db-account-email">{user?.email}</span>
            </div>
            <div className="db-account-meta">
              <span
                className={`db-account-role ${
                  isAdmin ? "db-account-role--admin" : ""
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ── inline create problem modal ──────────────────── */}
      <ProblemModal
        isOpen={showCreateModal}
        mode="create"
        problem={null}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateModalSave}
      />
    </div>
  );
}

export default Dashboard;
