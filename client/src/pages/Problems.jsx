import { useEffect, useState } from "react";

import { getAllProblems } from "../services/problem";
import { useAuth } from "../context/AuthContext";

function Problems() {
  const { user } = useAuth();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);

      const response = await getAllProblems();

      setProblems(response.data.problems);
    } catch (error) {
      setError("Failed to load problems.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div className="problems-page">
      <div className="problems-header">
        <h1>Problems</h1>

        {user?.role === "admin" && (
          <button className="btn-primary">
            + Create Problem
          </button>
        )}
      </div>

      {problems.length === 0 ? (
        <p>No problems found.</p>
      ) : (
        problems.map((problem) => (
          <div key={problem.id}>
            <h3>{problem.title}</h3>

            <p>{problem.difficulty}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Problems;