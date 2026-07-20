import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { FiZap, FiAlertCircle, FiChevronRight } from "react-icons/fi";
import { requestHint } from "../services/ai";

/**
 * AI Hint Panel — conversation-history style
 *
 * Behaviour:
 * - Hints accumulate; previous cards are never removed
 * - Each card shows its level number
 * - Auto-scrolls to the newest card after it appears
 * - Loading spinner appears below the last card while fetching
 * - Errors appear inline with a retry button
 * - Escalation is disabled after level 3
 */
export default function AIHintPanel({ problemId, language, userCode }) {
  // Array of { level: number, text: string }
  const [hints, setHints]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const bottomRef = useRef(null);

  // Scroll to newest card whenever hints list changes or loading starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hints, loading]);

  const currentLevel = hints.length; // 0, 1, 2, or 3
  const nextLevel    = currentLevel + 1;
  const maxReached   = currentLevel >= 3;

  const handleRequestHint = async () => {
    if (loading || maxReached) return;

    setLoading(true);
    setError("");

    try {
      const text = await requestHint({
        problemId,
        language,
        userCode,
        hintLevel: nextLevel,
      });

      setHints((prev) => [...prev, { level: nextLevel, text }]);
    } catch (err) {
      console.error("[AIHintPanel] Error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to generate hint. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-hint-panel">

      {/* ── empty state ─────────────────────────────────── */}
      {currentLevel === 0 && !loading && !error && (
        <div className="ai-hint-empty">
          <p className="ai-hint-intro">
            Get a focused hint to guide your next step — without spoiling the solution.
          </p>
          <button
            className="ai-hint-btn ai-hint-btn--primary"
            onClick={handleRequestHint}
          >
            <FiZap size={13} />
            Get Hint
          </button>
        </div>
      )}

      {/* ── hint history ────────────────────────────────── */}
      {hints.length > 0 && (
        <div className="ai-hint-history">
          {hints.map((hint, idx) => (
            <div key={idx} className="ai-hint-card">
              <div className="ai-hint-card-label">
                <FiZap size={11} className="ai-hint-card-icon" />
                Hint {hint.level}
              </div>
              <div className="ai-hint-content">
                <ReactMarkdown>{hint.text}</ReactMarkdown>
              </div>
              {/* divider between cards, but not after the last one */}
              {idx < hints.length - 1 && (
                <div className="ai-hint-divider" />
              )}
            </div>
          ))}

          {/* Loading appears as a card-in-progress below the last hint */}
          {loading && (
            <div className="ai-hint-card ai-hint-card--loading">
              <div className="ai-hint-card-label">
                <FiZap size={11} className="ai-hint-card-icon" />
                Hint {nextLevel}
              </div>
              <div className="ai-hint-loading-row">
                <span className="ai-hint-spinner" />
                <span className="ai-hint-loading-text">Generating hint…</span>
              </div>
            </div>
          )}

          {/* Error below hints */}
          {error && !loading && (
            <div className="ai-hint-card ai-hint-card--error">
              <div className="ai-hint-error-row">
                <FiAlertCircle size={14} />
                <span>{error}</span>
              </div>
              <button
                className="ai-hint-btn ai-hint-btn--secondary"
                onClick={handleRequestHint}
              >
                Retry
              </button>
            </div>
          )}

          {/* Actions row */}
          {!loading && !error && (
            <div className="ai-hint-actions">
              {!maxReached ? (
                <button
                  className="ai-hint-btn ai-hint-btn--next"
                  onClick={handleRequestHint}
                >
                  <FiChevronRight size={13} />
                  {currentLevel === 1 && "Need More Help"}
                  {currentLevel === 2 && "Still Stuck"}
                </button>
              ) : (
                <p className="ai-hint-max-notice">
                  No further hints available for this problem.
                </p>
              )}
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Loading spinner before any hint exists (first request) */}
      {currentLevel === 0 && loading && (
        <div className="ai-hint-empty ai-hint-loading-row">
          <span className="ai-hint-spinner" />
          <span className="ai-hint-loading-text">Generating hint…</span>
        </div>
      )}

      {/* Error before any hint exists */}
      {currentLevel === 0 && error && !loading && (
        <div className="ai-hint-empty">
          <div className="ai-hint-error-row">
            <FiAlertCircle size={14} />
            <span>{error}</span>
          </div>
          <button
            className="ai-hint-btn ai-hint-btn--secondary"
            onClick={handleRequestHint}
          >
            Retry
          </button>
        </div>
      )}

    </div>
  );
}
