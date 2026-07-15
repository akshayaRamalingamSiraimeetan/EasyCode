import { useEffect, useRef, useState } from "react";
import { FiTrash2, FiPlus } from "react-icons/fi";
import {
  getTestCases,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from "../services/problem";

/* ─── helpers ─────────────────────────────────────────────── */

// Generate a temporary client-side key for new (unsaved) test cases
let _tmpCounter = 0;
const tmpId = () => `__new_${++_tmpCounter}`;

const isNew = (tc) => tc.id.startsWith("__new_");

const blankTestCase = (orderIndex) => ({
  id: tmpId(),
  input: "",
  expectedOutput: "",
  isHidden: false,
  orderIndex,
});

/* ─── auto-grow textarea ───────────────────────────────────── */
function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={2}
    />
  );
}

/* ─── single test case card ────────────────────────────────── */
function TestCaseCard({ tc, index, onChange, onDelete, errors }) {
  return (
    <div className="tc-card">
      <div className="tc-card-header">
        <span className="tc-card-title">Test Case {index + 1}</span>

        <div className="tc-card-controls">
          {/* Order index */}
          <label className="tc-order-label">
            Order
            <input
              type="number"
              min="0"
              className="tc-order-input"
              value={tc.orderIndex}
              onChange={(e) =>
                onChange(tc.id, "orderIndex", Number(e.target.value))
              }
            />
          </label>

          {/* Hidden toggle */}
          <label className="tc-toggle-label">
            <span>Hidden</span>
            <div
              className={`tc-toggle ${tc.isHidden ? "tc-toggle--on" : ""}`}
              onClick={() => onChange(tc.id, "isHidden", !tc.isHidden)}
              role="switch"
              aria-checked={tc.isHidden}
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === " " && onChange(tc.id, "isHidden", !tc.isHidden)
              }
            >
              <span className="tc-toggle-thumb" />
            </div>
          </label>

          {/* Delete */}
          <button
            type="button"
            className="icon-btn delete-btn tc-delete-btn"
            title="Delete test case"
            onClick={() => onDelete(tc)}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Input</label>
        <AutoTextarea
          value={tc.input}
          onChange={(e) => onChange(tc.id, "input", e.target.value)}
          placeholder="Test case input"
          className={`tc-textarea${errors?.input ? " tc-field-error" : ""}`}
        />
        {errors?.input && <span className="tc-error-msg">{errors.input}</span>}
      </div>

      <div className="form-group">
        <label>Expected Output</label>
        <AutoTextarea
          value={tc.expectedOutput}
          onChange={(e) => onChange(tc.id, "expectedOutput", e.target.value)}
          placeholder="Expected output"
          className={`tc-textarea${
            errors?.expectedOutput ? " tc-field-error" : ""
          }`}
        />
        {errors?.expectedOutput && (
          <span className="tc-error-msg">{errors.expectedOutput}</span>
        )}
      </div>
    </div>
  );
}

/* ─── main modal ───────────────────────────────────────────── */
function ProblemModal({ isOpen, mode, problem, onClose, onSave }) {
  /* problem fields */
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    constraints: "",
  });

  /* test cases */
  const [testCases, setTestCases] = useState([]); // working copy
  const [originalTCs, setOriginalTCs] = useState([]); // snapshot for diff
  const [deletedIds, setDeletedIds] = useState([]); // existing IDs queued for deletion
  const [tcErrors, setTcErrors] = useState({}); // { [tc.id]: { input?, expectedOutput? } }

  /* ui state */
  const [loading, setLoading] = useState(false);
  const [tcLoading, setTcLoading] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── populate on open ────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    setFormError("");
    setTcErrors({});
    setDeletedIds([]);

    if (mode === "edit" && problem) {
      setFormData({
        title: problem.title ?? "",
        description: problem.description ?? "",
        difficulty: problem.difficulty ?? "Easy",
        constraints: problem.constraints ?? "",
      });

      // Fetch existing test cases
      setTcLoading(true);
      getTestCases(problem.id)
        .then((res) => {
          const loaded = res.data.testCases ?? [];
          setTestCases(loaded);
          setOriginalTCs(loaded);
        })
        .catch(() => {
          setTestCases([]);
          setOriginalTCs([]);
        })
        .finally(() => setTcLoading(false));
    } else {
      setFormData({
        title: "",
        description: "",
        difficulty: "Easy",
        constraints: "",
      });
      setTestCases([]);
      setOriginalTCs([]);
    }
  }, [isOpen, mode, problem]);

  if (!isOpen) return null;

  /* ── form field change ───────────────────────────────────── */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ── test case change ────────────────────────────────────── */
  const handleTcChange = (id, field, value) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
    // Clear field error on edit
    if (tcErrors[id]?.[field]) {
      setTcErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: undefined },
      }));
    }
  };

  /* ── add test case ───────────────────────────────────────── */
  const handleAddTC = () => {
    const nextOrder = testCases.length;
    setTestCases((prev) => [...prev, blankTestCase(nextOrder)]);
  };

  /* ── delete test case ────────────────────────────────────── */
  const handleDeleteTC = (tc) => {
    if (!isNew(tc)) {
      // Confirm before removing an existing (saved) test case
      if (
        !window.confirm(
          "Delete this test case? This will permanently remove it when you save."
        )
      ) {
        return;
      }
      setDeletedIds((prev) => [...prev, tc.id]);
    }
    setTestCases((prev) => prev.filter((t) => t.id !== tc.id));
    setTcErrors((prev) => {
      const next = { ...prev };
      delete next[tc.id];
      return next;
    });
  };

  /* ── validate test cases ─────────────────────────────────── */
  const validateTCs = () => {
    const errors = {};
    let valid = true;

    testCases.forEach((tc) => {
      const e = {};
      if (!tc.input.trim()) {
        e.input = "Input is required.";
        valid = false;
      }
      if (!tc.expectedOutput.trim()) {
        e.expectedOutput = "Expected output is required.";
        valid = false;
      }
      if (Object.keys(e).length) errors[tc.id] = e;
    });

    setTcErrors(errors);
    return valid;
  };

  /* ── submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateTCs()) {
      setFormError("Please fix the test case errors below.");
      return;
    }

    setFormError("");
    setLoading(true);

    try {
      const problemPayload = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        constraints: formData.constraints,
      };

      let savedProblemId;

      if (mode === "create") {
        // 1. Create the problem
        const res = await onSave({ mode: "create", problemData: problemPayload });
        savedProblemId = res?.id;

        // 2. Create every test case (continue on individual failures)
        const failures = [];
        for (const tc of testCases) {
          try {
            await createTestCase(savedProblemId, {
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden,
              orderIndex: tc.orderIndex,
            });
          } catch {
            failures.push(tc.orderIndex + 1);
          }
        }

        if (failures.length) {
          setFormError(
            `Problem created, but test case(s) #${failures.join(", ")} failed.`
          );
        }
      } else {
        // EDIT MODE

        // 1. Update the problem fields
        await onSave({ mode: "edit", problemData: problemPayload });

        const pid = problem.id;
        const failures = [];

        // 2. Delete queued test cases
        for (const id of deletedIds) {
          try {
            await deleteTestCase(id);
          } catch {
            // best-effort
          }
        }

        // 3. Compute diff — only send changed test cases
        const originalMap = Object.fromEntries(originalTCs.map((t) => [t.id, t]));

        for (const tc of testCases) {
          try {
            if (isNew(tc)) {
              // New test case — create
              await createTestCase(pid, {
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden,
                orderIndex: tc.orderIndex,
              });
            } else {
              // Existing — only update if anything changed
              const orig = originalMap[tc.id];
              if (
                orig &&
                (orig.input !== tc.input ||
                  orig.expectedOutput !== tc.expectedOutput ||
                  orig.isHidden !== tc.isHidden ||
                  orig.orderIndex !== tc.orderIndex)
              ) {
                await updateTestCase(tc.id, {
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isHidden: tc.isHidden,
                  orderIndex: tc.orderIndex,
                });
              }
            }
          } catch {
            failures.push(tc.orderIndex + 1);
          }
        }

        if (failures.length) {
          setFormError(
            `Problem saved, but test case(s) #${failures.join(", ")} failed.`
          );
          setLoading(false);
          return; // keep modal open so user can see the error
        }
      }
    } catch (err) {
      setFormError(err?.message || "Something went wrong.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  };

  /* ─────────────────────────── render ─────────────────────── */
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="problem-modal problem-modal--tall">
        <h2>{mode === "create" ? "Create Problem" : "Edit Problem"}</h2>

        {formError && (
          <p className="message message-error" style={{ marginBottom: 12 }}>
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── Problem Details ───────────────────────────── */}
          <div className="modal-section-divider">Problem Details</div>

          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
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

          {/* ── Test Cases ───────────────────────────────── */}
          <div className="modal-section-divider" style={{ marginTop: 28 }}>
            Test Cases
          </div>

          {tcLoading ? (
            <div className="tc-loading">
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : (
            <>
              {testCases.length === 0 && (
                <p className="tc-empty">
                  No test cases yet. Click &ldquo;+ Add Test Case&rdquo; to add one.
                </p>
              )}

              {testCases.map((tc, idx) => (
                <TestCaseCard
                  key={tc.id}
                  tc={tc}
                  index={idx}
                  onChange={handleTcChange}
                  onDelete={handleDeleteTC}
                  errors={tcErrors[tc.id]}
                />
              ))}

              <button
                type="button"
                className="tc-add-btn"
                onClick={handleAddTC}
              >
                <FiPlus style={{ marginRight: 6 }} />
                Add Test Case
              </button>
            </>
          )}

          {/* ── Actions ──────────────────────────────────── */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="header-btn"
              disabled={loading || tcLoading}
            >
              {loading
                ? "Saving..."
                : mode === "create"
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
