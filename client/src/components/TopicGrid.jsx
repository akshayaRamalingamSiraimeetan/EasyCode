/**
 * TopicGrid — Browse by Topic landing page.
 * Uses semantic theme tokens. No emojis — SVG icons only.
 */

/* ── topic SVG icons ─────────────────────────────────────── */
function IconCode() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function IconArray() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}
function IconString() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7V4h16v3" /><path d="M9 20h6" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}
function IconStack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconLinkedList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="12" r="3" /><circle cx="19" cy="12" r="3" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function IconTree() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="4" r="2" />
      <circle cx="6" cy="14" r="2" />
      <circle cx="18" cy="14" r="2" />
      <line x1="12" y1="6" x2="6" y2="12" />
      <line x1="12" y1="6" x2="18" y2="12" />
    </svg>
  );
}
function IconGraph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="5" r="2" /><circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
      <line x1="7" y1="5" x2="17" y2="5" />
      <line x1="5" y1="7" x2="5" y2="17" />
      <line x1="7" y1="19" x2="17" y2="19" />
      <line x1="19" y1="7" x2="19" y2="17" />
      <line x1="7" y1="7" x2="17" y2="17" />
    </svg>
  );
}
function IconDP() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
function IconGreedy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconHeap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="3" />
      <circle cx="6" cy="13" r="3" /><circle cx="18" cy="13" r="3" />
      <circle cx="3" cy="20" r="2" /><circle cx="9" cy="20" r="2" />
      <circle cx="15" cy="20" r="2" /><circle cx="21" cy="20" r="2" />
      <line x1="12" y1="8" x2="6" y2="10" /><line x1="12" y1="8" x2="18" y2="10" />
      <line x1="6" y1="16" x2="3" y2="18" /><line x1="6" y1="16" x2="9" y2="18" />
      <line x1="18" y1="16" x2="15" y2="18" /><line x1="18" y1="16" x2="21" y2="18" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconHash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}
function IconBacktrack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}
function IconAdvanced() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconDataStructures() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}
function IconDefault() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/* ── topic metadata (no emojis) ──────────────────────────── */
const TOPIC_META = {
  "basic programming":       { Icon: IconCode,           label: "Basic Programming" },
  arrays:                    { Icon: IconArray,           label: "Arrays" },
  strings:                   { Icon: IconString,          label: "Strings" },
  "stack & queue":           { Icon: IconStack,           label: "Stack & Queue" },
  "linked list":             { Icon: IconLinkedList,      label: "Linked List" },
  trees:                     { Icon: IconTree,            label: "Trees" },
  graphs:                    { Icon: IconGraph,           label: "Graphs" },
  "dynamic programming":     { Icon: IconDP,              label: "Dynamic Programming" },
  greedy:                    { Icon: IconGreedy,          label: "Greedy" },
  heaps:                     { Icon: IconHeap,            label: "Heaps" },
  "searching & sorting":     { Icon: IconSearch,          label: "Searching & Sorting" },
  "hashing & two pointers":  { Icon: IconHash,            label: "Hashing & Two Pointers" },
  backtracking:              { Icon: IconBacktrack,       label: "Backtracking" },
  advanced:                  { Icon: IconAdvanced,        label: "Advanced" },
  "advanced data structures":{ Icon: IconDataStructures,  label: "Advanced Data Structures" },
};

export function getTopicMeta(topic) {
  const key = (topic ?? "").toLowerCase();
  return TOPIC_META[key] ?? { Icon: IconDefault, label: topic ?? "Unknown" };
}

/* ── difficulty distribution bar ─────────────────────────── */
function DifficultyBar({ easy, medium, hard, total }) {
  if (!total) return null;
  const eW = Math.round((easy / total) * 100);
  const mW = Math.round((medium / total) * 100);
  const hW = 100 - eW - mW;

  return (
    <div
      className="tg-diff-bar"
      role="img"
      aria-label={`Easy: ${easy}, Medium: ${medium}, Hard: ${hard}`}
    >
      {eW > 0 && <span className="tg-diff-seg tg-diff-easy"   style={{ width: `${eW}%` }} />}
      {mW > 0 && <span className="tg-diff-seg tg-diff-medium" style={{ width: `${mW}%` }} />}
      {hW > 0 && <span className="tg-diff-seg tg-diff-hard"   style={{ width: `${hW}%` }} />}
    </div>
  );
}

/* ── single topic card ────────────────────────────────────── */
function TopicCard({ topic, count, easy, medium, hard, onClick }) {
  const { Icon, label } = getTopicMeta(topic);

  return (
    <button
      className="tg-card"
      onClick={onClick}
      aria-label={`Browse ${label} — ${count} problems`}
    >
      <div className="tg-card-header">
        <span className="tg-card-icon">
          <Icon />
        </span>
        <svg className="tg-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      <div className="tg-card-body">
        <h3 className="tg-card-name">{label}</h3>
        <p className="tg-card-count">{count} {count === 1 ? "problem" : "problems"}</p>
      </div>

      <DifficultyBar easy={easy} medium={medium} hard={hard} total={count} />

      <div className="tg-diff-legend">
        <span className="tg-legend-item tg-legend-easy">{easy}E</span>
        <span className="tg-legend-item tg-legend-medium">{medium}M</span>
        <span className="tg-legend-item tg-legend-hard">{hard}H</span>
      </div>
    </button>
  );
}

/* ── main grid component ──────────────────────────────────── */
function TopicGrid({ problems, onSelectTopic }) {
  const topicMap = {};

  problems.forEach((p) => {
    const raw = p.topic || "Other";
    const key = raw.toLowerCase();
    if (!topicMap[key]) {
      topicMap[key] = { topic: raw, count: 0, easy: 0, medium: 0, hard: 0 };
    }
    topicMap[key].count++;
    if      (p.difficulty === "Easy")   topicMap[key].easy++;
    else if (p.difficulty === "Medium") topicMap[key].medium++;
    else if (p.difficulty === "Hard")   topicMap[key].hard++;
  });

  const topics = Object.values(topicMap).sort((a, b) =>
    b.count !== a.count ? b.count - a.count : a.topic.localeCompare(b.topic)
  );

  if (topics.length === 0) {
    return (
      <div className="pb-empty-state">
        <div className="pb-empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <h3>No topics found</h3>
        <p>No problems have been added yet.</p>
      </div>
    );
  }

  return (
    <div className="tg-grid">
      {topics.map(({ topic, count, easy, medium, hard }) => (
        <TopicCard
          key={topic}
          topic={topic}
          count={count}
          easy={easy}
          medium={medium}
          hard={hard}
          onClick={() => onSelectTopic(topic)}
        />
      ))}
    </div>
  );
}

export default TopicGrid;
