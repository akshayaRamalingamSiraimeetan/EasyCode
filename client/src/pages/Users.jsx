import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getAllUsers, getUserDetails } from "../services/admin";
import AppNavbar from "../components/AppNavbar";

import {
  FiSearch,
  FiRefreshCw,
  FiFilter,
  FiUsers,
  FiUser,
  FiMail,
  FiCalendar,
  FiActivity,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

/* ── helpers ─────────────────────────────────────────────── */

function formatDate(date) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(date) {
  if (!date) return "Never";
  
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/* ── sub-components ──────────────────────────────────────── */

function UserAvatar({ username, size = 32 }) {
  return (
    <div 
      className="user-avatar" 
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`role-badge role-badge--${role}`}>
      {role}
    </span>
  );
}

function VerdictBadge({ verdict }) {
  return <span className={`verdict verdict--${verdict.replace('_', '-')}`}>{verdict.replace('_', ' ')}</span>;
}

function StatCard({ icon, label, value }) {
  return (
    <div className="user-stat-card">
      <div className="user-stat-icon">{icon}</div>
      <div className="user-stat-body">
        <span className="user-stat-value">{value}</span>
        <span className="user-stat-label">{label}</span>
      </div>
    </div>
  );
}

function UsersTable({ users, onViewDetails, loading }) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FiUsers size={32} />
        </div>
        <h3>No users found</h3>
        <p>Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Problems Solved</th>
            <th>Submissions</th>
            <th>Acceptance</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} onViewDetails={onViewDetails} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user, onViewDetails }) {
  return (
    <tr>
      <td>
        <div className="user-cell">
          <UserAvatar username={user.username} />
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
      </td>
      <td>
        <RoleBadge role={user.role} />
      </td>
      <td>{formatDate(user.createdAt)}</td>
      <td>{user.stats.problemsSolved}</td>
      <td>{user.stats.totalSubmissions}</td>
      <td>{user.stats.acceptanceRate}%</td>
      <td>{formatRelativeTime(user.lastActive)}</td>
      <td>
        <button
          className="table-btn"
          onClick={() => onViewDetails(user.id)}
        >
          <FiEye size={14} />
          View Details
        </button>
      </td>
    </tr>
  );
}

function UserCard({ user, onViewDetails }) {
  return (
    <div className="user-card">
      <div className="user-card-header">
        <UserAvatar username={user.username} size={40} />
        <div className="user-card-info">
          <h3>{user.username}</h3>
          <p>{user.email}</p>
        </div>
        <RoleBadge role={user.role} />
      </div>
      
      <div className="user-card-stats">
        <div className="user-card-stat">
          <span className="stat-value">{user.stats.problemsSolved}</span>
          <span className="stat-label">Problems Solved</span>
        </div>
        <div className="user-card-stat">
          <span className="stat-value">{user.stats.totalSubmissions}</span>
          <span className="stat-label">Submissions</span>
        </div>
        <div className="user-card-stat">
          <span className="stat-value">{user.stats.acceptanceRate}%</span>
          <span className="stat-label">Acceptance</span>
        </div>
      </div>
      
      <div className="user-card-meta">
        <p>Joined: {formatDate(user.createdAt)}</p>
        <p>Last Active: {formatRelativeTime(user.lastActive)}</p>
      </div>
      
      <button
        className="btn-primary user-card-btn"
        onClick={() => onViewDetails(user.id)}
      >
        <FiEye size={14} />
        View Details
      </button>
    </div>
  );
}

function UserDetailDrawer({ isOpen, onClose, userId, loading, userDetails }) {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>User Details</h2>
          <button className="drawer-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {loading ? (
          <div className="drawer-loading">
            <div className="spinner" />
          </div>
        ) : userDetails ? (
          <div className="drawer-content">
            {/* User Information */}
            <section className="drawer-section">
              <div className="user-profile">
                <UserAvatar username={userDetails.username} size={64} />
                <div className="user-profile-info">
                  <h3>{userDetails.username}</h3>
                  <p>{userDetails.email}</p>
                  <RoleBadge role={userDetails.role} />
                </div>
              </div>

              <div className="user-meta">
                <div className="user-meta-item">
                  <FiCalendar size={16} />
                  <span>Joined {formatDate(userDetails.createdAt)}</span>
                </div>
                <div className="user-meta-item">
                  <FiActivity size={16} />
                  <span>Last Active {formatRelativeTime(userDetails.lastActive)}</span>
                </div>
              </div>
            </section>

            {/* Statistics */}
            <section className="drawer-section">
              <h4>Statistics</h4>
              <div className="stats-grid">
                <StatCard 
                  icon={<FiUser size={20} />}
                  label="Problems Solved"
                  value={userDetails.stats.problemsSolved}
                />
                <StatCard 
                  icon={<FiActivity size={20} />}
                  label="Total Submissions"
                  value={userDetails.stats.totalSubmissions}
                />
                <StatCard 
                  icon={<FiActivity size={20} />}
                  label="Acceptance Rate"
                  value={`${userDetails.stats.acceptanceRate}%`}
                />
              </div>
              
              <div className="verdict-stats">
                <div className="verdict-stat">
                  <VerdictBadge verdict="accepted" />
                  <span>{userDetails.stats.accepted}</span>
                </div>
                <div className="verdict-stat">
                  <VerdictBadge verdict="wrong_answer" />
                  <span>{userDetails.stats.wrongAnswer}</span>
                </div>
                <div className="verdict-stat">
                  <VerdictBadge verdict="runtime_error" />
                  <span>{userDetails.stats.runtimeError}</span>
                </div>
                <div className="verdict-stat">
                  <VerdictBadge verdict="compilation_error" />
                  <span>{userDetails.stats.compilationError}</span>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="drawer-section">
              <h4>Recent Submissions</h4>
              {userDetails.recentSubmissions?.length > 0 ? (
                <div className="recent-submissions">
                  {userDetails.recentSubmissions.map((submission) => (
                    <div key={submission.id} className="submission-item">
                      <div className="submission-info">
                        <span className="submission-problem">{submission.problemTitle}</span>
                        <span className="submission-language">{submission.language}</span>
                      </div>
                      <div className="submission-meta">
                        <VerdictBadge verdict={submission.verdict} />
                        <span className="submission-time">
                          {formatRelativeTime(submission.submittedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-submissions">No submissions yet.</p>
              )}
            </section>
          </div>
        ) : (
          <div className="drawer-error">
            <p>Failed to load user details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <FiChevronLeft size={16} />
        Previous
      </button>
      
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      
      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <FiChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */

function Users() {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  /* ── fetch users ──────────────────────────────────────── */
  const fetchUsers = async (page = 1, searchQuery = search, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const response = await getAllUsers(page, 50, searchQuery);
      setUsers(response.data.users);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error(err);
      setError("Failed to load users. Please try again.");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ── fetch user details ───────────────────────────────── */
  const fetchUserDetails = async (userId) => {
    try {
      setDetailsLoading(true);
      const response = await getUserDetails(userId);
      setUserDetails(response.data.user);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user details");
    } finally {
      setDetailsLoading(false);
    }
  };

  /* ── event handlers ───────────────────────────────────── */
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, search);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(currentPage, search, false);
  };

  const handleViewDetails = (userId) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
    fetchUserDetails(userId);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedUserId(null);
    setUserDetails(null);
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage, search);
  };

  /* ── effects ──────────────────────────────────────────── */
  useEffect(() => {
    fetchUsers();
  }, []);

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="users-page">
      <AppNavbar title="Users" backTo="/dashboard" />

      <main className="users-main">
        {/* Header */}
        <section className="users-header">
          <div className="users-title">
            <h1>Users</h1>
            <p>Manage and monitor registered users.</p>
          </div>
        </section>

        {/* Controls */}
        <section className="users-controls">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-group">
              <FiSearch size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="header-btn">
              Search
            </button>
          </form>

          <div className="control-buttons">
            <button className="header-btn" disabled>
              <FiFilter size={16} />
              Filter
            </button>
            <button 
              className="header-btn" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw size={16} className={refreshing ? "spinning" : ""} />
              Refresh
            </button>
          </div>
        </section>

        {/* Content */}
        <section className="users-content">
          {error ? (
            <div className="error-state">
              <p>{error}</p>
              <button className="btn-primary" onClick={() => fetchUsers()}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="desktop-view">
                <UsersTable 
                  users={users} 
                  onViewDetails={handleViewDetails}
                  loading={loading}
                />
              </div>

              {/* Mobile Cards */}
              <div className="mobile-view">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FiUsers size={32} />
                    </div>
                    <h3>No users found</h3>
                    <p>Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  <div className="users-cards">
                    {users.map((user) => (
                      <UserCard 
                        key={user.id} 
                        user={user} 
                        onViewDetails={handleViewDetails} 
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </section>
      </main>

      {/* User Details Drawer */}
      <UserDetailDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        userId={selectedUserId}
        loading={detailsLoading}
        userDetails={userDetails}
      />
    </div>
  );
}

export default Users;