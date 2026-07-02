import ProblemRow from "./ProblemRow";

function ProblemsTable({
  problems,
  onEdit,
  onDelete,
}) {
  return (
    <table className="problems-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>Difficulty</th>
          <th>Actions</th>
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