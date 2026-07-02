import { useEffect, useState } from "react";

import { getAllProblems } from "../services/problem";
import { useAuth } from "../context/AuthContext";
import ProblemsTable from "../components/ProblemsTable";
import ProblemModal from "../components/ProblemModal";
import { createProblem } from "../services/problem";

function Problems() {
  const { user } = useAuth();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] = useState("create");

  const [selectedProblem, setSelectedProblem] = useState(null);
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

  const handleCreateProblem = async (problemData) => {
    try {
      await createProblem(problemData);

      setShowModal(false);

      fetchProblems();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create problem.");
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
          <button
            className="header-btn"
            onClick={() => {
              setModalMode("create");
              setSelectedProblem(null);
              setShowModal(true);
            }}
          >
            + Create Problem
          </button>
        )}
      </div>

      {problems.length === 0 ? (
        <p>No problems found.</p>
      ) : (
        <ProblemsTable
          problems={problems}
          isAdmin={user?.role === "admin"}
          onEdit={(problem) => console.log(problem)}
          onDelete={(problem) => console.log(problem)}
        />
      )}

      <ProblemModal
        isOpen={showModal}
        mode={modalMode}
        problem={selectedProblem}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProblem}
      />
    </div>
  );
}

export default Problems;
