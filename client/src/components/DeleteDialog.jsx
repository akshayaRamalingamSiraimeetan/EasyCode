function DeleteDialog({
  isOpen,
  problem,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="delete-dialog">

        <h2>Delete Problem</h2>

        <p>
          Are you sure you want to delete
        </p>

        <h3>{problem?.title}</h3>

        <div className="modal-actions">

          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="delete-btn-large"
            onClick={onConfirm}
          >
            Delete
          </button>

        </div>

      </div>
    </div>
  );
}

export default DeleteDialog;