import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
  const [sortBy, setSortBy] = useState("title");

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

  // Called by ProblemModal for both create and edit.
  // Must return the saved problem object so the modal can attach test cases.
  const handleModalSave = async ({ mode, problemData }) => {
    if (mode === "create") {
      const res = await createProblem(problemData);
      toast.success("Problem created successfully.");
      fetchProblems();
      return res.data.problem; // modal uses .id to create test cases
    } else {
      await updateProblem(selectedProblem.id, problemData);
      toast.success("Problem updated successfully.");
      setSelectedProblem(null);
      await fetchProblems();
      return { id: selectedProblem.id };
    }
  };

  const handleDeleteProblem = async () => {
    try {
      await deleteProblem(selectedProblem.id);
      toast.success("Problem deleted successfully.");
      setShowDeleteDialog(false);

      setSelectedProblem(null);

      await fetchProblems();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete problem.");
    }
  };

  const difficultyOrder = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
  };

  const filteredProblems = [...problems]
    .filter((problem) =>
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });

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

        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="title">Sort by Title</option>

          <option value="difficulty">Sort by Difficulty</option>
        </select>
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
        <div className="table-container">
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
        </div>
      )}

      <ProblemModal
        isOpen={showModal}
        mode={modalMode}
        problem={selectedProblem}
        onClose={() => {
          setShowModal(false);
          setSelectedProblem(null);
        }}
        onSave={handleModalSave}
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
