import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const difficultyConfig = {
  Easy: {
    label: "Easy",
    className: "easy",
  },

  Medium: {
    label: "Medium",
    className: "medium",
  },

  Hard: {
    label: "Hard",
    className: "hard",
  },
};

function ProblemRow({ index, problem, isAdmin, onEdit, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <tr>
      <td>{index}</td>

      <td>{problem.title}</td>

      <td>
        <span
          className={`difficulty ${
            difficultyConfig[problem.difficulty].className
          }`}
        >
          {difficultyConfig[problem.difficulty].label}
        </span>
      </td>

      {isAdmin && <td>{problem.createdByUsername}</td>}

      <td>
        <div className="action-buttons">
          <button
            className="table-btn"
            onClick={() => navigate(`/problems/${problem.id}/solve`)}
          >
            Solve
          </button>

          {user?.role === "admin" && (
            <>
              <button
                className="icon-btn"
                onClick={() => onEdit(problem)}
                title="Edit Problem"
              >
                <FiEdit2 />
              </button>

              <button
                className="icon-btn delete-btn"
                onClick={() => onDelete(problem)}
                title="Delete Problem"
              >
                <FiTrash2 />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default ProblemRow;
