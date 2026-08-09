/**
 * TopicGrid — Browse by Topic landing page
 * Shows a responsive card grid, one card per topic.
 */

const TOPIC_META = {
  "basic programming": { icon: "⚡", label: "Basic Programming" },
  arrays: { icon: "📦", label: "Arrays" },
  strings: { icon: "🔤", label: "Strings" },
  "stack & queue": { icon: "📚", label: "Stack & Queue" },
  "linked list": { icon: "🔗", label: "Linked List" },
  trees: { icon: "🌳", label: "Trees" },
  graphs: { icon: "🕸️", label: "Graphs" },
  "dynamic programming": { icon: "🧠", label: "Dynamic Programming" },
  greedy: { icon: "💡", label: "Greedy" },
  heaps: { icon: "🏔️", label: "Heaps" },
  "searching & sorting": { icon: "🔍", label: "Searching & Sorting" },
  "hashing & two pointers": { icon: "#️⃣", label: "Hashing & Two Pointers" },
  backtracking: { icon: "↩️", label: "Backtracking" },
  advanced: { icon: "🚀", label: "Advanced" },
  "advanced data structures": { icon: "🏗️", label: "Advanced Data Structures" },
};

function getTopicMeta(topic) {
  const key = topic.toLowerCase();
  return TOPIC_META[key] ?? { icon: "📝", label: topic };
}

function DifficultyBar({ easy, medium, hard, total }) {
  if (!total) return null;
  const eW = Math.round((easy / total) * 100);
  const mW = Math.round((medium / total) * 100);
  const hW = 100 - eW - mW;

  return (
    <div className="tg-diff-bar" aria-label={`Easy: ${easy}, Medium: ${medium}, Hard: ${hard}`}>
      {eW > 0 && <span className="tg-diff-seg tg-diff-easy" style={{ width: `${eW}%` }} />}
      {mW > 0 && <span className="tg-diff-seg tg-diff-medium" style={{ width: `${mW}%` }} />}
      {hW > 0 && <span className="tg-diff-seg tg-diff-hard" style={{ width: `${hW}%` }} />}
    </div>
  );
}

function TopicCard({ topic, count, easy, medium, hard, onClick }) {
  const meta = getTopicMeta(topic);

  return (
    <button className="tg-card" onClick={onClick} aria-label={`Browse ${meta.label} — ${count} problems`}>
      <div className="tg-card-header">
        <span className="tg-card-icon" aria-hidden="true">{meta.icon}</span>
        <span className="tg-card-arrow">→</span>
      </div>

      <div className="tg-card-body">
        <h3 className="tg-card-name">{meta.label}</h3>
        <p className="tg-card-count">{count} {count === 1 ? "problem" : "problems"}</p>
      </div>

      <DifficultyBar easy={easy} medium={medium} hard={hard} total={count} />

      <div className="tg-diff-legend">
        <span className="tg-legend-item tg-legend-easy">{easy} Easy</span>
        <span className="tg-legend-item tg-legend-medium">{medium} Med</span>
        <span className="tg-legend-item tg-legend-hard">{hard} Hard</span>
      </div>
    </button>
  );
}

function TopicGrid({ problems, onSelectTopic }) {
  // Build a map: topic → { count, easy, medium, hard }
  const topicMap = {};

  problems.forEach((p) => {
    const key = (p.topic || "Other").toLowerCase();
    if (!topicMap[key]) {
      topicMap[key] = { topic: p.topic || "Other", count: 0, easy: 0, medium: 0, hard: 0 };
    }
    topicMap[key].count++;
    if (p.difficulty === "Easy") topicMap[key].easy++;
    else if (p.difficulty === "Medium") topicMap[key].medium++;
    else if (p.difficulty === "Hard") topicMap[key].hard++;
  });

  // Sort by count descending, then by topic name
  const topics = Object.values(topicMap).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.topic.localeCompare(b.topic);
  });

  if (topics.length === 0) {
    return (
      <div className="pb-empty-state">
        <div className="pb-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
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
export { getTopicMeta };
