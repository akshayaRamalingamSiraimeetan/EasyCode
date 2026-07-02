import { useEffect, useState } from "react";

function ProblemModal({
  isOpen,
  mode,
  problem,
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    constraints: "",
  });

  useEffect(() => {
    if (mode === "edit" && problem) {
      setFormData({
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        constraints: problem.constraints,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        difficulty: "Easy",
        constraints: "",
      });
    }
  }, [mode, problem]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="problem-modal">

        <h2>
          {mode === "create"
            ? "Create Problem"
            : "Edit Problem"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Title</label>

            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              rows="5"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Difficulty</label>

            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>Constraints</label>

            <input
              name="constraints"
              value={formData.constraints}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">

            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="header-btn"
            >
              {mode === "create"
                ? "Create"
                : "Update"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default ProblemModal;