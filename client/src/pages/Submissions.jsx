import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiZap,
  FiCode,
  FiX,
} from "react-icons/fi";

import { getMySubmissions, getSubmissionById } from "../services/submission";

/* ─── helpers ────────────────────────────────────────────── */

const VERDICTS = [
  { value: "",                      label: "All Verdicts" },
  { value: "accepted",              label: "Accepted" },
  { value: "wrong_answer",          label: "Wrong Answer" },
  { value: "runtime_error",         label: "Runtime Error" },
  { value: "compilation_error",     label: "Compilation Error" },
  { value: "time_limit_exceeded",   label: "Time Limit Exceeded" },
  { value: "output_limit_exceeded", label: "Output Limit Exceeded" },
];

const LANGUAGES = [
  { value: "",       label: "All Languages" },
  { value: "python", label: "Python 3" },
  { value: "cpp",    label: "C++ 17" },
  { value: "c",      label: "C" },
  { value: "java",   label: "Java" },
];

const LANG_LABELS = {
  python: "Python 3",
  cpp:    "C++ 17",
  c:      "C",
  java:   "Java",
};

const MONACO_LANG = { python: "python", cpp: "cpp", c: "c", java: "java" };

function verdictLabel(v) {
  return VERDICTS.find((d) => d.value === v)?.label ?? v;
}

function verdictClass(v) {
  switch (v) {
    case "accepted":              return "sub-verdict--accepted";
    case "wrong_answer":          return "sub-verdict--wrong";
    case "time_limit_exceeded":
    case "output_limit_exceeded": return "sub-verdict--tle";
    default:                      return "sub-verdict--error";
  }
}

function VerdictIcon({ verdict, size = 14 }) {
  switch (verdict) {
    case "accepted":              return <FiCheckCircle size={size} />;
    case "wrong_answer":          return <FiXCircle size={size} />;
    case "time_limit_exceeded":   return <FiClock size={size} />;
    case "output_limit_exceeded": return <FiZap size={size} />;
    default:                      return <FiAlertTriangle size={size} />;
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─── submission detail modal ────────────────────────────── */

function SubmissionModal({ submissionId, onClose }) {
  const [sub, setSub]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!submissionId) return;
    setLoading(true);
    setError("");
    getSubmissionById(submissionId)
      .then((res) => setSub(res.data.submission))
      .catch(() => setError("Failed to load submission."))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (!submissionId) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sub-modal">
        <div className="sub-modal-header">
          <div className="sub-modal-title-row">
            <FiCode size={16} />
            <span>Submission Details</span>
          </div>
          <button
            className="sub-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {loading && (
          <div className="sub-modal-loading">
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {error && <p className="message message-error">{error}</p>}

        {!loading && sub && (
          <>
            {/* meta strip */}
            <div className="sub-modal-meta">
              <div className="sub-modal-meta-item">
                <span className="sub-modal-meta-label">Problem</span>
                <span className="sub-modal-meta-value">{sub.problemTitle}</span>
              </div>
              <div className="sub-modal-meta-item">
                <span className="sub-modal-meta-label">Verdict</span>
                <span className={`sub-verdict-pill ${verdictClass(sub.verdict)}`}>
                  <VerdictIcon verdict={sub.verdict} size={12} />
                  {verdictLabel(sub.verdict)}
                </span>
              </div>
              <div className="sub-modal-meta-item">
                <span className="sub-modal-meta-label">Language</span>
                <span className="sub-modal-meta-value">
                  {LANG_LABELS[sub.language] ?? sub.language}
                </span>
              </div>
              <div className="sub-modal-meta-item">
                <span className="sub-modal-meta-label">Passed</span>
                <span className="sub-modal-meta-value">
                  {sub.passed} / {sub.total}
                </span>
              </div>
              <div className="sub-modal-meta-item">
                <span className="sub-modal-meta-label">Submitted</span>
                <span className="sub-modal-meta-value">
                  {formatDate(sub.submittedAt)}
                </span>
              </div>
              {sub.runtime != null && (
                <div className="sub-modal-meta-item">
                  <span className="sub-modal-meta-label">Runtime</span>
                  <span className="sub-modal-meta-value">{sub.runtime} ms</span>
                </div>
              )}
            </div>

            {/* read-only code viewer */}
            <div className="sub-modal-code-label">Submitted Code</div>
            <div className="sub-modal-editor">
              <Editor
                language={MONACO_LANG[sub.language] ?? "plaintext"}
                value={sub.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 13,
                  lineHeight: 20,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 10, bottom: 10 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  renderLineHighlight: "none",
                  contextmenu: false,
                  scrollbar: { vertical: "auto" },
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────── */

export default function Submissions() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  /* pagination */
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 50; // fetch generous amount; client-side filters work on this

  /* filters */
  const [search,  setSearch]  = useState("");
  const [lang,    setLang]    = useState("");
  const [verdict, setVerdict] = useState("");
  const [sortDir, setSortDir] = useState("desc"); // "desc" | "asc"

  /* detail modal */
  const [selectedId, setSelectedId] = useState(null);

  /* ── fetch ───────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    getMySubmissions(page, LIMIT)
      .then((res) => {
        setSubmissions(res.data.submissions ?? []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      })
      .catch(() => setError("Failed to load submissions."))
      .finally(() => setLoading(false));
  }, [page]);

  /* ── client-side filter + sort ───────────────────────── */
  const filtered = submissions
    .filter((s) => {
      const matchSearch  = !search  || s.problemTitle.toLowerCase().includes(search.toLowerCase());
      const matchLang    = !lang    || s.language === lang;
      const matchVerdict = !verdict || s.verdict === verdict;
      return matchSearch && matchLang && matchVerdict;
    })
    .sort((a, b) => {
      const ta = new Date(a.submittedAt).getTime();
      const tb = new Date(b.submittedAt).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });

  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className="problems-page">

      {/* ── page header ──────────────────────────────────── */}
      <div className="problems-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="solve-back-btn"
            style={{ background: "transparent", border: "1px solid #ddd", color: "#555" }}
            onClick={() => navigate("/dashboard")}
            title="Back to Dashboard"
          >
            <FiArrowLeft size={15} />
          </button>
          <div>
            <h1 style={{ marginBottom: 2 }}>My Submissions</h1>
            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Your full submission history</p>
          </div>
        </div>
        <button
          className="header-btn"
          onClick={() => navigate("/problems")}
        >
          Browse Problems
        </button>
      </div>

      {/* ── filters ──────────────────────────────────────── */}
      <div className="table-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search by problem title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 220px" }}
        />

        <select
          className="sort-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        <select
          className="sort-select"
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
        >
          {VERDICTS.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>

        <select
          className="sort-select"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* ── states ───────────────────────────────────────── */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
        </div>
      )}

      {!loading && error && (
        <div className="empty-state">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            {submissions.length === 0 ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </div>
          <h3>
            {submissions.length === 0 ? "No submissions yet" : "No results found"}
          </h3>
          <p>
            {submissions.length === 0
              ? "Submit a solution to a problem and it will appear here."
              : "No submissions match your current filters."}
          </p>
          {submissions.length === 0 && (
            <button
              className="header-btn"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/problems")}
            >
              Browse Problems
            </button>
          )}
        </div>
      )}

      {/* ── table ────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="table-container">
          <table className="problems-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Problem</th>
                <th>Language</th>
                <th>Passed</th>
                <th>Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="sub-row"
                  onClick={() => setSelectedId(s.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span className={`sub-verdict-pill ${verdictClass(s.verdict)}`}>
                      <VerdictIcon verdict={s.verdict} size={11} />
                      {verdictLabel(s.verdict)}
                    </span>
                  </td>
                  <td className="sub-problem-title">{s.problemTitle}</td>
                  <td>{LANG_LABELS[s.language] ?? s.language}</td>
                  <td>{s.passed} / {s.total}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: 13, color: "#666" }}>
                    {formatDate(s.submittedAt)}
                  </td>
                  <td>
                    <button
                      className="table-btn"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(s.id); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── pagination ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="sub-pagination">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span className="sub-pagination-label">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── detail modal ─────────────────────────────────── */}
      {selectedId && (
        <SubmissionModal
          submissionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
