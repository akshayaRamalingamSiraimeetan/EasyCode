import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      <p>Welcome to EasyCode.</p>

      <p>
        Authentication Status:{" "}
        <strong>
          {isAuthenticated ? "Logged In" : "Not Logged In"}
        </strong>
      </p>
    </div>
  );
}

export default Dashboard;