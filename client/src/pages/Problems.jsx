import { useEffect, useState } from "react";

import { getAllProblems } from "../services/problem";
import { useAuth } from "../context/AuthContext";
import ProblemsTable from "../components/ProblemsTable";
import ProblemModal from "../components/ProblemModal";
import DeleteDialog from "../components/DeleteDialog";
import {
  createProblem,
  updateProblem,
  deleteProblem,
} from "../services/problem";

function Problems() {
  const { user } = useAuth();

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleUpdateProblem = async (problemData) => {
    try {
      await updateProblem(selectedProblem.id, problemData);

      setShowModal(false);
      setSelectedProblem(null);

      await fetchProblems();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update problem.");
    }
  };

  const handleDeleteProblem = async () => {
    try {
      await deleteProblem(selectedProblem.id);

      setShowDeleteDialog(false);

      setSelectedProblem(null);

      await fetchProblems();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete problem.");
    }
  };

  const filteredProblems = problems.filter((problem) =>
    problem.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

      <div className="table-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {problems.length === 0 ? (
        <div className="empty-state">
          <h3>No problems found</h3>

          {user?.role === "admin" ? (
            <p>
              Create your first coding problem using the
              <strong> + Create Problem </strong>
              button.
            </p>
          ) : (
            <p>No problems are currently available.</p>
          )}
        </div>
      ) : (
        <ProblemsTable
          problems={filteredProblems}
          isAdmin={user?.role === "admin"}
          onEdit={(problem) => {
            setSelectedProblem(problem);
            setModalMode("edit");
            setShowModal(true);
          }}
          onDelete={(problem) => {
            setSelectedProblem(problem);
            setShowDeleteDialog(true);
          }}
        />
      )}

      <ProblemModal
        isOpen={showModal}
        mode={modalMode}
        problem={selectedProblem}
        onClose={() => {
          setShowModal(false);
          setSelectedProblem(null);
        }}
        onSubmit={
          modalMode === "create" ? handleCreateProblem : handleUpdateProblem
        }
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        problem={selectedProblem}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedProblem(null);
        }}
        onConfirm={handleDeleteProblem}
      />
    </div>
  );
}

export default Problems;
