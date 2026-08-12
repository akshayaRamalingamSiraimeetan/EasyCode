import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

/* ─── single sample test case card ──────────────────────── */
function SampleTestCaseCard({ sample, index }) {
  const [expanded, setExpanded] = useState(index === 0); // First one expanded by default

  return (
    <div className="stc-card">
      <button
        className="stc-card-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="stc-card-title">Sample {index + 1}</span>
        {expanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="stc-card-body">
          <div className="stc-block">
            <span className="stc-label">Input</span>
            <pre className="stc-code">{sample.input}</pre>
          </div>

          <div className="stc-block">
            <span className="stc-label">Output</span>
            <pre className="stc-code">{sample.expectedOutput}</pre>
          </div>

          {sample.explanation && (
            <div className="stc-block">
              <span className="stc-label">Explanation</span>
              <p className="stc-explanation">{sample.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function SampleTestCases({ testCases }) {
  // Filter to show sample test cases
  let sampleTests = testCases?.filter((tc) => tc.isSample) || [];

  // Fallback: If no test cases are explicitly marked as samples,
  // use the first 2 public (non-hidden) test cases
  if (sampleTests.length === 0) {
    const publicTests = testCases?.filter((tc) => !tc.isHidden) || [];
    sampleTests = publicTests.slice(0, 2);
  }

  // Don't render anything if there are no sample test cases
  if (sampleTests.length === 0) {
    return null;
  }

  return (
    <div className="stc-container">
      {sampleTests.map((sample, idx) => (
        <SampleTestCaseCard key={sample.id || idx} sample={sample} index={idx} />
      ))}
    </div>
  );
}
