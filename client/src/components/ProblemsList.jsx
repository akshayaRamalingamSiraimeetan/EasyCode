/**
 * ProblemsList — Flat problem table with smart search, difficulty tabs,
 * and tag filter pills. Theme-aware via CSS custom properties.
 *
 * Props:
 *   problems  — array of problem objects
 *   isAdmin   — boolean, shows edit / delete controls
 *   onEdit    — (problem) => void
 *   onDelete  — (problem) => void
 *   loading   — boolean
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2, FiSearch, FiX, FiCheck } from "react-icons/fi";

/* ── difficulty config ──────────────────────────────────── */
const DIFF_ORDER = { Easy: 1, Medium: 2, Hard: 3 };

const DIFF_STYLE = {
  Easy:   { label: "Easy",   cls: "pb-badge--easy" },
  Medium: { label: "Medium", cls: "pb-badge--medium" },
  Hard:   { label: "Hard",   cls: "pb-badge--hard" },
};

/* ── multi-token fuzzy search ───────────────────────────── */
function matchesSearch(problem, query) {
  if (!query.trim()) return true;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [
    problem.title,
    problem.slug,
    problem.topic,
    problem.difficulty,
    ...(problem.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // All tokens must match somewhere in haystack
  return tokens.every((t) => haystack.includes(t));
}

/* ── collect all unique tags ─────────────────────────────── */
function collectTags(problems) {
  const set = new Set();
  problems.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

/* ── single problem row ─────────────────────────────────── */
function ProblemRow({ index, problem, isAdmin, onEdit, onDelete }) {
  const navigate = useNavigate();
  const diff = DIFF_STYLE[problem.difficulty] ?? { label: problem.difficulty, cls: "" };

  return (
    <tr className="pb-row">
      <td className="pb-td pb-td--num">{index}</td>

      <td className="pb-td pb-td--title">
        <button
          className="pb-title-btn"
          onClick={() => navigate(`/problems/${problem.id}/solve`)}
          title={`Solve: ${problem.title}`}
        >
          {problem.title}
        </button>
        {(problem.tags ?? []).length > 0 && (
          <div className="pb-tags">
            {problem.tags.map((tag) => (
              <span key={tag} className="pb-tag">{tag}</span>
            ))}
          </div>
        )}
      </td>

      <td className="pb-td pb-td--diff">
        <span className={`pb-badge ${diff.cls}`}>{diff.label}</span>
      </td>

      <td className="pb-td pb-td--actions">
        <div className="pb-actions">
          <button
            className="pb-solve-btn"
            onClick={() => navigate(`/problems/${problem.id}/solve`)}
          >
            Solve
          </button>

          {isAdmin && (
            <>
              <button
                className="pb-icon-btn"
                onClick={() => onEdit(problem)}
                title="Edit problem"
                aria-label="Edit problem"
              >
                <FiEdit2 size={13} />
              </button>
              <button
                className="pb-icon-btn pb-icon-btn--del"
                onClick={() => onDelete(problem)}
                title="Delete problem"
                aria-label="Delete problem"
              >
                <FiTrash2 size={13} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── skeleton rows ──────────────────────────────────────── */
function SkeletonRows({ count = 8 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="pb-row">
      <td className="pb-td pb-td--num"><span className="pb-skel pb-skel--num" /></td>
      <td className="pb-td pb-td--title"><span className="pb-skel pb-skel--title" /></td>
      <td className="pb-td pb-td--diff"><span className="pb-skel pb-skel--badge" /></td>
      <td className="pb-td pb-td--actions"><span className="pb-skel pb-skel--btn" /></td>
    </tr>
  ));
}

/* ── main component ─────────────────────────────────────── */
export default function ProblemsList({
  problems,
  isAdmin = false,
  onEdit,
  onDelete,
  loading = false,
}) {
  const [search,     setSearch]     = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [activeTags, setActiveTags] = useState(new Set());

  const allTags = useMemo(() => collectTags(problems), [problems]);

  const toggleTag = (tag) =>
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const clearFilters = () => {
    setSearch("");
    setDiffFilter("All");
    setActiveTags(new Set());
  };

  const hasFilters = !!search || diffFilter !== "All" || activeTags.size > 0;

  const filtered = useMemo(() => {
    return problems
      .filter((p) => {
        if (!matchesSearch(p, search)) return false;
        if (diffFilter !== "All" && p.difficulty !== diffFilter) return false;
        if (activeTags.size > 0) {
          const pTags = new Set(p.tags ?? []);
          for (const t of activeTags) if (!pTags.has(t)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const d = DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty];
        return d !== 0 ? d : a.title.localeCompare(b.title);
      });
  }, [problems, search, diffFilter, activeTags]);

  return (
    <div className="pb-list">

      {/* ── sticky toolbar ────────────────────────────────── */}
      <div className="pb-toolbar">
        <div className="pb-search-wrap">
          <FiSearch className="pb-search-icon" size={14} aria-hidden="true" />
          <input
            type="text"
            className="pb-search"
            placeholder="Search by title, topic, tag, difficulty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search problems"
          />
          {search && (
            <button
              className="pb-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <FiX size={11} />
            </button>
          )}
        </div>

        <div className="pb-diff-tabs" role="group" aria-label="Filter by difficulty">
          {["All", "Easy", "Medium", "Hard"].map((d) => (
            <button
              key={d}
              className={[
                "pb-diff-tab",
                diffFilter === d ? "pb-diff-tab--active" : "",
                d !== "All" ? `pb-diff-tab--${d.toLowerCase()}` : "",
              ].join(" ")}
              onClick={() => setDiffFilter(d)}
              aria-pressed={diffFilter === d}
            >
              {d}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button className="pb-clear-btn" onClick={clearFilters} aria-label="Clear all filters">
            <FiX size={11} />
            Clear
          </button>
        )}
      </div>

      {/* ── tag filter strip ──────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="pb-tag-filters" role="group" aria-label="Filter by tag">
          <span className="pb-tag-label" aria-hidden="true">Tags</span>
          <div className="pb-tag-list">
            {allTags.map((tag) => {
              const active = activeTags.has(tag);
              return (
                <button
                  key={tag}
                  className={`pb-tag-filter${active ? " pb-tag-filter--active" : ""}`}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                >
                  {active && <FiCheck size={10} aria-hidden="true" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── result count ──────────────────────────────────── */}
      {!loading && (
        <p className="pb-result-count">
          {filtered.length} problem{filtered.length !== 1 ? "s" : ""}
          {hasFilters && (
            <span className="pb-result-count-secondary">
              {" "}of {problems.length}
            </span>
          )}
        </p>
      )}

      {/* ── table ─────────────────────────────────────────── */}
      <div className="pb-table-wrap">
        <table className="pb-table">
          <thead>
            <tr>
              <th className="pb-th pb-th--num">#</th>
              <th className="pb-th pb-th--title">Title</th>
              <th className="pb-th pb-th--diff">Difficulty</th>
              <th className="pb-th pb-th--actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows count={8} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="pb-td--empty">
                  <div className="pb-empty-state">
                    <div className="pb-empty-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <p>No problems match your filters.</p>
                    {hasFilters && (
                      <button className="pb-empty-reset" onClick={clearFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((problem, idx) => (
                <ProblemRow
                  key={problem.id}
                  index={idx + 1}
                  problem={problem}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
