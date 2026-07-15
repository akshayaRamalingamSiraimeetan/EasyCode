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
  FiTerminal,
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

const MONACO_LANG = { python: "python", cpp: "cpp", c: "c", java: "java" };

const DEFAULT_CODE = {
  python: `# Write your solution here\n\n`,
  cpp:    `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  c:      `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  java:   `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
};

const CONSOLE_MIN     = 40;
const CONSOLE_DEFAULT = 260;

/* ─── helpers ────────────────────────────────────────────── */

/** Map a run-result status string to a display label */
function statusLabel(status) {
  switch (status) {
    case "passed":              return "Passed";
    case "wrong_answer":        return "Wrong Answer";
    case "runtime_error":       return "Runtime Error";
    case "time_limit_exceeded": return "Time Limit Exceeded";
    case "output_limit_exceeded": return "Output Limit Exceeded";
    case "compilation_error":   return "Compilation Error";
    case "executed":            return "Executed";
    case "error":               return "Error";
    default:                    return status ?? "Unknown";
  }
}

/** CSS modifier for a run result status */
function statusMod(status) {
  if (status === "passed" || status === "executed") return "ok";
  if (status === "wrong_answer")                     return "wrong";
  return "err";
}

/* ─── run-result tab indicator dot ──────────────────────── */
function TabDot({ status }) {
  const mod = statusMod(status);
  return <span className={`rt-tab-dot rt-tab-dot--${mod}`} />;
}

/* ─── content for a single run-result tab ────────────────── */
function RunResultPane({ item }) {
  if (!item) return null;

  if (item.type === "custom") {
    return (
      <div className="rt-pane">
        <div className="rt-pane-block">
          <span className="rt-label">Input</span>
          <pre className="rt-pre rt-pre--neutral">{item.input || "(empty)"}</pre>
        </div>
        <div className="rt-pane-block">
          <span className="rt-label">Output</span>
          {item.stderr ? (
            <pre className="rt-pre rt-pre--err">{item.stderr}</pre>
          ) : (
            <pre className="rt-pre rt-pre--neutral">{item.output || "(no output)"}</pre>
          )}
        </div>
      </div>
    );
  }

  /* public test case */
  const mod = statusMod(item.status);
  return (
    <div className="rt-pane">
      <div className={`rt-status-banner rt-status-banner--${mod}`}>
        {mod === "ok"    && <FiCheckCircle size={15} />}
        {mod === "wrong" && <FiXCircle     size={15} />}
        {mod === "err"   && <FiAlertTriangle size={15} />}
        <span>{statusLabel(item.status)}</span>
      </div>

      <div className="rt-pane-cols">
        <div className="rt-pane-block">
          <span className="rt-label">Input</span>
          <pre className="rt-pre rt-pre--neutral">{item.input || "(empty)"}</pre>
        </div>
        <div className="rt-pane-block">
          <span className="rt-label">Expected</span>
          <pre className="rt-pre rt-pre--expected">{item.expected || "(empty)"}</pre>
        </div>
        <div className="rt-pane-block">
          <span className="rt-label">Your Output</span>
          <pre className={`rt-pre rt-pre--${mod === "ok" ? "expected" : "actual"}`}>
            {item.output || "(no output)"}
          </pre>
        </div>
      </div>

      {item.stderr && (
        <div className="rt-pane-block" style={{ marginTop: 10 }}>
          <span className="rt-label">Stderr</span>
          <pre className="rt-pre rt-pre--err">{item.stderr}</pre>
        </div>
      )}
    </div>
  );
}

/* ─── submit verdict display ─────────────────────────────── */
function SubmitVerdict({ data }) {
  if (!data) return null;
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

/* ─── copy button ────────────────────────────────────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button className="qp-copy-btn" onClick={handle} title="Copy" aria-label="Copy">
      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
    </button>
  );
}

/* ─── collapsible problem section ────────────────────────── */
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

/* ─── left problem panel ─────────────────────────────────── */
function ProblemPanel({ problem }) {
  const contentRef = useRef(null);
  const diffCls = problem.difficulty?.toLowerCase() ?? "easy";
  const tags = Array.isArray(problem.tags)
    ? problem.tags
    : typeof problem.tags === "string" && problem.tags.trim()
    ? problem.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <aside className="qp-panel">
      <div className="qp-content" ref={contentRef}>
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

        <QpSection id="qp-description-body" icon={<FiFileText size={14} />} title="Description">
          <p className="qp-body-text">{problem.description}</p>
        </QpSection>

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

  /* problem */
  const [problem, setProblem]         = useState(null);
  const [probLoading, setProbLoading] = useState(true);
  const [probError, setProbError]     = useState("");

  /* editor */
  const [language, setLanguage] = useState("python");
  const [codeMap, setCodeMap]   = useState({ ...DEFAULT_CODE });

  /* console state */
  const [consoleMode, setConsoleMode]   = useState("input"); // "input" | "run" | "submit"
  const [customInput, setCustomInput]   = useState("");
  const [runResults, setRunResults]     = useState([]);      // array of result items
  const [activeRunTab, setActiveRunTab] = useState(0);       // index into runResults
  const [submitData, setSubmitData]     = useState(null);
  const [running, setRunning]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  /* console resize */
  const [consoleH, setConsoleH]   = useState(CONSOLE_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const dragRef = useRef(null);
  const startY  = useRef(0);
  const startH  = useRef(0);

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
      const next = Math.max(CONSOLE_MIN, startH.current + (startY.current - ev.clientY));
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

  const toggleConsole = () => {
    if (collapsed) { setCollapsed(false); setConsoleH(CONSOLE_DEFAULT); }
    else           { setCollapsed(true);  setConsoleH(CONSOLE_MIN); }
  };

  const expandConsole = () => {
    if (collapsed) { setCollapsed(false); setConsoleH(CONSOLE_DEFAULT); }
  };

  /* ── code helpers ────────────────────────────────────── */
  const currentCode = codeMap[language] ?? DEFAULT_CODE[language];
  const handleCodeChange   = (val) => setCodeMap((p) => ({ ...p, [language]: val ?? "" }));
  const handleLanguageChange = (e) => setLanguage(e.target.value);

  /* ── run ─────────────────────────────────────────────── */
  const handleRun = useCallback(async () => {
    if (running || submitting) return;
    setRunning(true);
    setConsoleMode("run");
    setRunResults([]);
    expandConsole();

    try {
      const res = await runCode(language, currentCode, id, customInput);
      const items = res.data.results ?? [];
      setRunResults(items);
      // Default to first tab; if custom input was run, jump to it
      const customIdx = items.findIndex((r) => r.type === "custom");
      setActiveRunTab(customIdx >= 0 && items.length - 1 === customIdx
        ? customIdx
        : 0);
    } catch (err) {
      setRunResults([{
        type: "custom",
        name: "Error",
        status: "error",
        input: "",
        output: "",
        stderr: err.response?.data?.message ?? "Request failed.",
      }]);
      setActiveRunTab(0);
    } finally {
      setRunning(false);
    }
  }, [running, submitting, language, currentCode, id, customInput]);

  /* ── submit ──────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (running || submitting) return;
    setSubmitting(true);
    setConsoleMode("submit");
    setSubmitData(null);
    expandConsole();

    try {
      const res = await submitSolution(language, currentCode, id);
      setSubmitData(res.data);
    } catch (err) {
      setSubmitData({
        verdict: {
          status: "compilation_error",
          stderr: err.response?.data?.message ?? "Request failed.",
        },
      });
    } finally {
      setSubmitting(false);
    }
  }, [running, submitting, language, currentCode, id]);

  const busy = running || submitting;

  /* ── loading / error screens ─────────────────────────── */
  if (probLoading) return <div className="solve-loading"><div className="spinner" /></div>;
  if (probError || !problem) {
    return (
      <div className="solve-loading">
        <p>{probError || "Problem not found."}</p>
        <button className="header-btn" onClick={() => navigate("/problems")}>Back to Problems</button>
      </div>
    );
  }

  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className="solve-page">

      {/* ── top nav ──────────────────────────────────────── */}
      <header className="solve-nav">
        <div className="solve-nav-left">
          <button className="solve-back-btn" onClick={() => navigate("/problems")} title="Back to Problems">
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
            {running ? <span className="btn-spinner" /> : <FiPlay size={14} />}
            Run
          </button>
          <button
            className="solve-submit-btn"
            onClick={handleSubmit}
            disabled={busy}
            title="Submit (Ctrl+Shift+Enter)"
          >
            {submitting ? <span className="btn-spinner" /> : <FiSend size={14} />}
            Submit
          </button>
        </div>
      </header>

      {/* ── main workspace ───────────────────────────────── */}
      <main className="solve-workspace">

        {/* LEFT */}
        <ProblemPanel problem={problem} />

        {/* RIGHT */}
        <section className="solve-right">

          {/* language bar */}
          <div className="solve-editor-bar">
            <select className="solve-lang-select" value={language} onChange={handleLanguageChange}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Monaco */}
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

          {/* ── console ──────────────────────────────────── */}
          <div
            className="solve-console-wrap"
            style={{ height: collapsed ? CONSOLE_MIN : consoleH }}
          >
            {/* handle / tab bar */}
            <div className="solve-console-handle" onMouseDown={onDragStart}>
              <div className="solve-console-tabs">

                {/* Input tab — always present */}
                <button
                  className={`console-tab${consoleMode === "input" ? " console-tab--active" : ""}`}
                  onClick={() => { setConsoleMode("input"); expandConsole(); }}
                >
                  Input
                </button>

                {/* Run result tabs — one per execution result */}
                {consoleMode === "run" && runResults.map((item, idx) => (
                  <button
                    key={idx}
                    className={`console-tab rt-tab${activeRunTab === idx && consoleMode === "run" ? " console-tab--active" : ""}`}
                    onClick={() => { setActiveRunTab(idx); expandConsole(); }}
                  >
                    {item.type === "custom"
                      ? <FiTerminal size={11} style={{ marginRight: 4 }} />
                      : <TabDot status={item.status} />
                    }
                    {item.name}
                  </button>
                ))}

                {/* Submit result tab */}
                {(consoleMode === "submit" || submitData) && (
                  <button
                    className={`console-tab${consoleMode === "submit" ? " console-tab--active" : ""}`}
                    onClick={() => { setConsoleMode("submit"); expandConsole(); }}
                  >
                    {submitData && (
                      <span className={`console-tab-dot ${
                        (submitData.verdict ?? submitData)?.status === "accepted" ? "dot-ok" : "dot-err"
                      }`} />
                    )}
                    Result
                  </button>
                )}
              </div>

              <button
                className="console-collapse-btn"
                onClick={toggleConsole}
                title={collapsed ? "Expand" : "Collapse"}
              >
                {collapsed ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </button>
            </div>

            {/* console body */}
            {!collapsed && (
              <div className="solve-console-body">

                {/* Input mode */}
                {consoleMode === "input" && (
                  <textarea
                    className="console-textarea"
                    placeholder="Custom input (optional) — used when you click Run"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    spellCheck={false}
                  />
                )}

                {/* Run mode */}
                {consoleMode === "run" && (
                  <div className="console-output-area">
                    {running ? (
                      <div className="console-running">
                        <span className="btn-spinner btn-spinner--dark" />
                        <span>Running against test cases…</span>
                      </div>
                    ) : runResults.length === 0 ? (
                      <p className="console-placeholder">No results yet.</p>
                    ) : (
                      <RunResultPane item={runResults[activeRunTab]} />
                    )}
                  </div>
                )}

                {/* Submit mode */}
                {consoleMode === "submit" && (
                  <div className="console-output-area">
                    {submitting ? (
                      <div className="console-running">
                        <span className="btn-spinner btn-spinner--dark" />
                        <span>Judging…</span>
                      </div>
                    ) : submitData ? (
                      <SubmitVerdict data={submitData} />
                    ) : (
                      <p className="console-placeholder">Submit your solution to see results.</p>
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
