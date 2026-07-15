import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiZap,
  FiChevronDown,
  FiChevronUp,
  FiPlay,
  FiSend,
  FiFileText,
  FiLock,
  FiCopy,
  FiCheck,
} from "react-icons/fi";

import { getProblemById } from "../services/problem";
import { runCode, submitSolution } from "../services/compiler";

/* ─── constants ──────────────────────────────────────────── */

const LANGUAGES = [
  { value: "python", label: "Python 3" },
  { value: "cpp",    label: "C++ 17"   },
  { value: "c",      label: "C"        },
  { value: "java",   label: "Java"     },
];

const MONACO_LANG = {
  python: "python",
  cpp:    "cpp",
  c:      "c",
  java:   "java",
};

const DEFAULT_CODE = {
  python: `# Write your solution here\n\n`,
  cpp:    `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  c:      `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  java:   `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
};

const CONSOLE_MIN = 40;   // px — collapsed handle height
const CONSOLE_DEFAULT = 240;

/* ─── verdict helpers ────────────────────────────────────── */

function VerdictDisplay({ result }) {
  if (!result) return null;

  const { type, data } = result;

  if (type === "run") {
    // Raw run output
    const isErr = data.status !== "success" && data.status !== undefined && !data.success;
    return (
      <div className="verdict-run">
        {data.error ? (
          <pre className="verdict-stderr">{data.error}</pre>
        ) : (
          <pre className="verdict-stdout">{data.output ?? "(no output)"}</pre>
        )}
        {data.executionTime && (
          <span className="verdict-meta">
            <FiClock size={12} /> {data.executionTime} ms
          </span>
        )}
      </div>
    );
  }

  // Submission verdict
  const v = data.verdict ?? data;
  const status = v.status;

  if (status === "accepted") {
    return (
      <div className="verdict-card verdict-accepted">
        <div className="verdict-header">
          <FiCheckCircle className="verdict-icon" />
          <span className="verdict-title">Accepted</span>
        </div>
        <p className="verdict-detail">
          Passed <strong>{v.passed}</strong> / <strong>{v.total}</strong> test cases
        </p>
      </div>
    );
  }

  if (status === "wrong_answer") {
    return (
      <div className="verdict-card verdict-wrong">
        <div className="verdict-header">
          <FiXCircle className="verdict-icon" />
          <span className="verdict-title">Wrong Answer</span>
        </div>
        <p className="verdict-detail">
          Failed on test case <strong>#{v.failedTestCase}</strong> &nbsp;·&nbsp;
          Passed <strong>{v.passed}</strong> / <strong>{v.total}</strong>
        </p>
        <div className="verdict-diff">
          <div className="verdict-diff-col">
            <span className="verdict-diff-label">Expected</span>
            <pre className="verdict-diff-pre verdict-diff-expected">{v.expectedOutput}</pre>
          </div>
          <div className="verdict-diff-col">
            <span className="verdict-diff-label">Your Output</span>
            <pre className="verdict-diff-pre verdict-diff-actual">{v.actualOutput}</pre>
          </div>
        </div>
      </div>
    );
  }

  if (status === "compilation_error") {
    return (
      <div className="verdict-card verdict-error">
        <div className="verdict-header">
          <FiAlertTriangle className="verdict-icon" />
          <span className="verdict-title">Compilation Error</span>
        </div>
        <pre className="verdict-stderr">{v.stderr}</pre>
      </div>
    );
  }

  if (status === "runtime_error") {
    return (
      <div className="verdict-card verdict-error">
        <div className="verdict-header">
          <FiAlertTriangle className="verdict-icon" />
          <span className="verdict-title">Runtime Error</span>
        </div>
        {v.stderr && <pre className="verdict-stderr">{v.stderr}</pre>}
        <p className="verdict-detail">
          Failed on test case <strong>#{v.failedTestCase}</strong>
        </p>
      </div>
    );
  }

  if (status === "time_limit_exceeded") {
    return (
      <div className="verdict-card verdict-tle">
        <div className="verdict-header">
          <FiClock className="verdict-icon" />
          <span className="verdict-title">Time Limit Exceeded</span>
        </div>
        <p className="verdict-detail">
          Failed on test case <strong>#{v.failedTestCase}</strong>
        </p>
      </div>
    );
  }

  if (status === "output_limit_exceeded") {
    return (
      <div className="verdict-card verdict-tle">
        <div className="verdict-header">
          <FiZap className="verdict-icon" />
          <span className="verdict-title">Output Limit Exceeded</span>
        </div>
        <p className="verdict-detail">
          Failed on test case <strong>#{v.failedTestCase}</strong>
        </p>
      </div>
    );
  }

  // Fallback
  return (
    <div className="verdict-card verdict-error">
      <div className="verdict-header">
        <FiAlertTriangle className="verdict-icon" />
        <span className="verdict-title">Error</span>
      </div>
      <pre className="verdict-stderr">{JSON.stringify(v, null, 2)}</pre>
    </div>
  );
}

/* ─── copy-to-clipboard button ───────────────────────────── */

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      className="qp-copy-btn"
      onClick={handle}
      title="Copy to clipboard"
      aria-label="Copy code"
    >
      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
    </button>
  );
}

/* ─── collapsible content block ─────────────────────────── */

function QpSection({ id, icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="qp-section" id={id}>
      <button
        className="qp-section-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="qp-section-label">
          <span className="qp-section-icon">{icon}</span>
          {title}
        </span>
        {open ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
      </button>
      {open && <div className="qp-section-body">{children}</div>}
    </div>
  );
}

/* ─── the full left panel ────────────────────────────────── */

function ProblemPanel({ problem }) {
  const contentRef = useRef(null);

  const diffCls = problem.difficulty?.toLowerCase() ?? "easy";

  /* parse tags — stored as array or comma-string */
  const tags = Array.isArray(problem.tags)
    ? problem.tags
    : typeof problem.tags === "string" && problem.tags.trim()
    ? problem.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <aside className="qp-panel">
      <div className="qp-content" ref={contentRef}>

        {/* ── title / meta card ─────────────────────────── */}
        <div className="qp-meta-card" id="qp-description">
          <h1 className="qp-title">{problem.title}</h1>
          <div className="qp-meta-row">
            <span className={`difficulty ${diffCls} qp-diff-badge`}>
              {problem.difficulty}
            </span>
            {tags.map((tag) => (
              <span key={tag} className="qp-tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* ── description ───────────────────────────────── */}
        <QpSection id="qp-description-body" icon={<FiFileText size={14} />} title="Description">
          <p className="qp-body-text">{problem.description}</p>
        </QpSection>

        {/* ── constraints ───────────────────────────────── */}
        {problem.constraints && (
          <QpSection id="qp-constraints" icon={<FiLock size={14} />} title="Constraints">
            <div className="qp-code-block-wrap">
              <CopyButton text={problem.constraints} />
              <pre className="qp-code-block">{problem.constraints}</pre>
            </div>
          </QpSection>
        )}



      </div>
    </aside>
  );
}

/* ─── main page ──────────────────────────────────────────── */

export default function Solve() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* problem data */
  const [problem, setProblem]   = useState(null);
  const [probLoading, setProbLoading] = useState(true);
  const [probError, setProbError]   = useState("");

  /* editor state — per-language code is preserved */
  const [language, setLanguage] = useState("python");
  const [codeMap, setCodeMap]   = useState({ ...DEFAULT_CODE });

  /* console */
  const [activeTab, setActiveTab]   = useState("input");   // input | output | result
  const [customInput, setCustomInput] = useState("");
  const [result, setResult]         = useState(null);       // { type, data }
  const [running, setRunning]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* console resize */
  const [consoleH, setConsoleH] = useState(CONSOLE_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const dragRef    = useRef(null);
  const startY     = useRef(0);
  const startH     = useRef(0);

  /* ── fetch problem ───────────────────────────────────── */
  useEffect(() => {
    if (!id) return;
    setProbLoading(true);
    getProblemById(id)
      .then((res) => setProblem(res.data.problem))
      .catch(() => setProbError("Problem not found."))
      .finally(() => setProbLoading(false));
  }, [id]);

  /* ── keyboard shortcuts ──────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ── console drag-resize ─────────────────────────────── */
  const onDragStart = (e) => {
    startY.current = e.clientY;
    startH.current = consoleH;
    dragRef.current = true;

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const delta = startY.current - ev.clientY;
      const next = Math.max(CONSOLE_MIN, startH.current + delta);
      setConsoleH(next);
      if (next > CONSOLE_MIN + 10) setCollapsed(false);
    };
    const onUp = () => {
      dragRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* ── code helpers ────────────────────────────────────── */
  const currentCode = codeMap[language] ?? DEFAULT_CODE[language];

  const handleCodeChange = (val) => {
    setCodeMap((prev) => ({ ...prev, [language]: val ?? "" }));
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  /* ── run ─────────────────────────────────────────────── */
  const handleRun = useCallback(async () => {
    if (running || submitting) return;
    setRunning(true);
    setActiveTab("output");
    setResult(null);

    try {
      const res = await runCode(language, currentCode, customInput);
      setResult({ type: "run", data: res.data });
    } catch (err) {
      setResult({
        type: "run",
        data: { error: err.response?.data?.message ?? "Request failed." },
      });
    } finally {
      setRunning(false);
      if (collapsed) {
        setCollapsed(false);
        setConsoleH(CONSOLE_DEFAULT);
      }
    }
  }, [running, submitting, language, currentCode, customInput, collapsed]);

  /* ── submit ──────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (running || submitting) return;
    setSubmitting(true);
    setActiveTab("result");
    setResult(null);

    try {
      const res = await submitSolution(language, currentCode, id);
      setResult({ type: "submit", data: res.data });
    } catch (err) {
      setResult({
        type: "submit",
        data: {
          verdict: {
            status: "compilation_error",
            stderr: err.response?.data?.message ?? "Request failed.",
          },
        },
      });
    } finally {
      setSubmitting(false);
      if (collapsed) {
        setCollapsed(false);
        setConsoleH(CONSOLE_DEFAULT);
      }
    }
  }, [running, submitting, language, currentCode, id, collapsed]);

  const busy = running || submitting;

  /* ── toggle collapse ─────────────────────────────────── */
  const toggleConsole = () => {
    if (collapsed) {
      setCollapsed(false);
      setConsoleH(CONSOLE_DEFAULT);
    } else {
      setCollapsed(true);
      setConsoleH(CONSOLE_MIN);
    }
  };

  /* ── loading / error screens ─────────────────────────── */
  if (probLoading) {
    return (
      <div className="solve-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (probError || !problem) {
    return (
      <div className="solve-loading">
        <p>{probError || "Problem not found."}</p>
        <button className="header-btn" onClick={() => navigate("/problems")}>
          Back to Problems
        </button>
      </div>
    );
  }

  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className="solve-page">

      {/* ── top nav ──────────────────────────────────────── */}
      <header className="solve-nav">
        <div className="solve-nav-left">
          <button
            className="solve-back-btn"
            onClick={() => navigate("/problems")}
            title="Back to Problems"
          >
            <FiArrowLeft size={16} />
          </button>
          <span className="solve-nav-title">{problem.title}</span>
          <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="solve-nav-right">
          <button
            className="solve-run-btn"
            onClick={handleRun}
            disabled={busy}
            title="Run Code (Ctrl+Enter)"
          >
            {running ? (
              <span className="btn-spinner" />
            ) : (
              <FiPlay size={14} />
            )}
            Run
          </button>

          <button
            className="solve-submit-btn"
            onClick={handleSubmit}
            disabled={busy}
            title="Submit (Ctrl+Shift+Enter)"
          >
            {submitting ? (
              <span className="btn-spinner" />
            ) : (
              <FiSend size={14} />
            )}
            Submit
          </button>
        </div>
      </header>

      {/* ── main workspace ───────────────────────────────── */}
      <main className="solve-workspace">

        {/* ── LEFT: problem panel ───────────────────────── */}
        <ProblemPanel problem={problem} />

        {/* ── RIGHT: editor + console ───────────────────── */}
        <section className="solve-right">

          {/* language selector bar */}
          <div className="solve-editor-bar">
            <select
              className="solve-lang-select"
              value={language}
              onChange={handleLanguageChange}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monaco editor */}
          <div className="solve-editor-wrap" style={{ flex: 1, minHeight: 0 }}>
            <Editor
              language={MONACO_LANG[language]}
              value={currentCode}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontLigatures: true,
                renderLineHighlight: "line",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                bracketPairColorization: { enabled: true },
                tabSize: 4,
              }}
            />
          </div>

          {/* drag handle + console */}
          <div
            className="solve-console-wrap"
            style={{ height: collapsed ? CONSOLE_MIN : consoleH }}
          >
            {/* drag handle */}
            <div
              className="solve-console-handle"
              onMouseDown={onDragStart}
            >
              <div className="solve-console-tabs">
                <button
                  className={`console-tab${activeTab === "input"  ? " console-tab--active" : ""}`}
                  onClick={() => { setActiveTab("input");  if (collapsed) toggleConsole(); }}
                >
                  Input
                </button>
                <button
                  className={`console-tab${activeTab === "output" ? " console-tab--active" : ""}`}
                  onClick={() => { setActiveTab("output"); if (collapsed) toggleConsole(); }}
                >
                  Output
                </button>
                <button
                  className={`console-tab${activeTab === "result" ? " console-tab--active" : ""}`}
                  onClick={() => { setActiveTab("result"); if (collapsed) toggleConsole(); }}
                >
                  Result
                  {result?.type === "submit" && (
                    <span className={`console-tab-dot ${result.data?.verdict?.status === "accepted" ? "dot-ok" : "dot-err"}`} />
                  )}
                </button>
              </div>

              <button
                className="console-collapse-btn"
                onClick={toggleConsole}
                title={collapsed ? "Expand console" : "Collapse console"}
              >
                {collapsed ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </button>
            </div>

            {/* console body */}
            {!collapsed && (
              <div className="solve-console-body">
                {activeTab === "input" && (
                  <textarea
                    className="console-textarea"
                    placeholder="Custom input for Run Code..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    spellCheck={false}
                  />
                )}

                {activeTab === "output" && (
                  <div className="console-output-area">
                    {running ? (
                      <div className="console-running">
                        <span className="btn-spinner btn-spinner--dark" />
                        <span>Running…</span>
                      </div>
                    ) : result?.type === "run" ? (
                      <VerdictDisplay result={result} />
                    ) : (
                      <p className="console-placeholder">
                        Run your code to see output here.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "result" && (
                  <div className="console-output-area">
                    {submitting ? (
                      <div className="console-running">
                        <span className="btn-spinner btn-spinner--dark" />
                        <span>Judging…</span>
                      </div>
                    ) : result?.type === "submit" ? (
                      <VerdictDisplay result={result} />
                    ) : (
                      <p className="console-placeholder">
                        Submit your solution to see results here.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  );
}
