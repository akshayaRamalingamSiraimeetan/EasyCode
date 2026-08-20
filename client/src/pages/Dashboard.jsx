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
  FiFileText,
  FiCheckCircle,
  FiBookOpen,
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

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="db-stat-card">
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
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }) {
  return (
    <button className="db-action-card" onClick={onClick}>
      <div className="db-action-icon">{icon}</div>
      <div className="db-action-body">
        <span className="db-action-title">{title}</span>
        <span className="db-action-desc">{description}</span>
      </div>
      <span className="db-action-arrow">→</span>
    </button>
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
    },
    {
      icon: <FiCheckCircle size={20} />,
      label: "My Submissions",
      value: totalSubmissions === null ? "…" : totalSubmissions,
    },
    {
      icon: <FiCalendar size={20} />,
      label: "Joined",
      value: formatJoined(user?.createdAt),
    },
  ];

  /* ── quick actions ────────────────────────────────────── */
  const adminActions = [
    {
      icon: <FiPlusSquare size={22} />,
      title: "Create Problem",
      description: "Add a new coding challenge",
      onClick: () => setShowCreateModal(true),
    },
    {
      icon: <FiList size={22} />,
      title: "Manage Problems",
      description: "Edit, delete, or update test cases",
      onClick: () => navigate("/problems"),
    },
    {
      icon: <FiUsers size={22} />,
      title: "Users",
      description: "Manage and monitor registered users",
      onClick: () => navigate("/users"),
    },
    {
      icon: <FiFileText size={22} />,
      title: "View Submissions",
      description: "Review your submitted solutions",
      onClick: () => navigate("/submissions"),
    },
  ];

  const userActions = [
    {
      icon: <FiBookOpen size={22} />,
      title: "Browse Problems",
      description: "Explore the problem set",
      onClick: () => navigate("/problems"),
    },
    {
      icon: <FiCheckCircle size={22} />,
      title: "My Submissions",
      description: "Review your past solutions",
      onClick: () => navigate("/submissions"),
    },
  ];

  const actions = isAdmin ? adminActions : userActions;

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
              <StatCard
                icon={<FiUsers size={20} />}
                label="Registered Users"
                value={platformUsers === null ? "…" : platformUsers}
              />
              <StatCard
                icon={<FiActivity size={20} />}
                label="Total Submissions"
                value={platformSubmissions === null ? "…" : platformSubmissions}
              />
            </div>
          </section>
        )}

        {/* ── overview stats ──────────────────────────────── */}
        <section className="db-section">
          <h2 className="db-section-title">Overview</h2>
          <div className="db-stats-grid">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* ── quick actions ───────────────────────────────── */}
        <section className="db-section">
          <h2 className="db-section-title">Quick Actions</h2>
          <div className="db-actions-grid">
            {actions.map((a) => (
              <ActionCard key={a.title} {...a} />
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
