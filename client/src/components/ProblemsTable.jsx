import ProblemRow from "./ProblemRow";

function ProblemsTable({ problems, onEdit, onDelete }) {
  return (
    <table className="problems-table">
      <thead>
        <tr>
          <th className="col-number">#</th>
          <th className="col-title">Title</th>
          <th className="col-difficulty">Difficulty</th>
          <th className="col-actions">Actions</th>
        </tr>
      </thead>

      <tbody>
        {problems.map((problem, index) => (
          <ProblemRow
            key={problem.id}
            index={index + 1}
            problem={problem}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
}

export default ProblemsTable;
