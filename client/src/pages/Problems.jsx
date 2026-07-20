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
    return (
      <div className="loading-state" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h3>Something went wrong</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="problems-page">
      <div className="problems-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>Problems</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            {filteredProblems.length} problem{filteredProblems.length !== 1 ? "s" : ""} found
          </p>
        </div>

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
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <h3>No problems yet</h3>
          {user?.role === "admin" ? (
            <p>Create your first coding problem using the <strong>+ Create Problem</strong> button above.</p>
          ) : (
            <p>No problems are currently available. Check back soon.</p>
          )}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3>No results found</h3>
          <p>Try adjusting your search or filter.</p>
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
