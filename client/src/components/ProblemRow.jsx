import { useAuth } from "../context/AuthContext";

function ProblemRow({ index, problem, onEdit, onDelete }) {
  const { user } = useAuth();

  return (
    <tr>
      <td>{index}</td>

      <td>{problem.title}</td>

      <td>
        <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
          {problem.difficulty}
        </span>
      </td>

      <td>
        <div className="action-buttons">
          <button className="table-btn">Solve</button>

          {user?.role === "admin" && (
            <>
              <button
                className="icon-btn"
                onClick={() => onEdit(problem)}
                title="Edit Problem"
              >
                ✏
              </button>

              <button
                className="icon-btn delete-btn"
                onClick={() => onDelete(problem)}
                title="Delete Problem"
              >
                🗑
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default ProblemRow;
