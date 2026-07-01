import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();

  const {
    logout,
    isAuthenticated,
  } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>EasyCode</h1>

        <p>Welcome to your dashboard.</p>

        <p>
          Status:
          <strong>
            {isAuthenticated ? " Logged In" : " Logged Out"}
          </strong>
        </p>

        <button
          className="btn-primary"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;