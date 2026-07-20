import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { getAllProblems, createProblem } from "../services/problem";
import { getMySubmissions } from "../services/submission";
import ProblemModal from "../components/ProblemModal";

import {
  FiCode,
  FiList,
  FiPlusSquare,
  FiFileText,
  FiLogOut,
  FiCheckCircle,
  FiBookOpen,
  FiCalendar,
} from "react-icons/fi";

/* ── helpers ─────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
        style={accent ? { color: "var(--color-accent)" } : {}}
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
  const { logout, user } = useAuth();

  const isAdmin = user?.role === "admin";

  /* ── stats state ──────────────────────────────────────── */
  const [totalProblems, setTotalProblems] = useState(null);
  const [totalSubmissions, setTotalSubmissions] = useState(null);

  /* ── inline create-problem modal ─────────────────────── */
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* ── fetch stats on mount ─────────────────────────────── */
  useEffect(() => {
    // Total problems — reuse existing endpoint, just read the count
    getAllProblems()
      .then((res) => setTotalProblems(res.data.count ?? res.data.problems?.length ?? 0))
      .catch(() => setTotalProblems("—"));

    // Total submissions for the logged-in user — fetch 1 item, read pagination.total
    getMySubmissions(1, 1)
      .then((res) => setTotalSubmissions(res.data.pagination?.total ?? 0))
      .catch(() => setTotalSubmissions("—"));
  }, []);

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

  /* ── logout ───────────────────────────────────────────── */
  const handleLogout = () => {
    logout();
    navigate("/login");
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
      {/* ── header ──────────────────────────────────────── */}
      <header className="db-header">
        <div className="db-header-left">
          <div className="db-logo">
            <FiCode size={20} />
            <span>EasyCode</span>
          </div>
        </div>
        <div className="db-header-right">
          <span className="db-header-date">{formatDate()}</span>
          <button className="db-logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

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
