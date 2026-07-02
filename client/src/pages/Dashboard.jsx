import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();

  const { logout, isAuthenticated, user } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>EasyCode</h1>
        <p>
          Welcome back,
          <strong> {user?.username}</strong>.
        </p>
        <p>
          Role:
          <strong>{user?.role}</strong>
        </p>
        <p>Email: {user?.email}</p>
        <p>
          Status:
          <strong>{isAuthenticated ? " Logged In" : " Logged Out"}</strong>
        </p>

        <button className="btn-primary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
