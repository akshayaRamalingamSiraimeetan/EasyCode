import ProblemRow from "./ProblemRow";

function ProblemsTable({ problems, isAdmin, onEdit, onDelete }) {
  return (
    <table className="problems-table">
      <thead>
        <tr>
          <th className="col-number">#</th>
          <th className="col-title">Title</th>
          <th className="col-difficulty">Difficulty</th>
          {isAdmin && <th className="col-created-by">Created By</th>}
          <th className="col-actions">Actions</th>
        </tr>
      </thead>

      <tbody>
        {problems.map((problem, index) => (
          <ProblemRow
            key={problem.id}
            index={index + 1}
            problem={problem}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
}

export default ProblemsTable;
