/**
 * Problems page — redesigned with two views:
 *   1. Browse by Topic (default) — topic card grid
 *   2. All Problems — flat table with search + filters
 *
 * Topic view → clicking a card → Topic detail view with filtered table.
 *
 * All existing admin functionality (Create / Edit / Delete) is preserved.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiCode, FiGrid, FiList, FiPlusSquare } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import { getAllProblems, createProblem, updateProblem, deleteProblem } from "../services/problem";
import TopicGrid, { getTopicMeta } from "../components/TopicGrid";
import ProblemsList from "../components/ProblemsList";
import ProblemModal from "../components/ProblemModal";
import DeleteDialog from "../components/DeleteDialog";

/* ── view modes ─────────────────────────────────────────── */
const VIEW_TOPICS = "topics";   // topic card grid
const VIEW_ALL    = "all";      // flat all-problems list
const VIEW_TOPIC  = "topic";    // single-topic detail

/* ─────────────────────────────────────────────────────────── */

function Problems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  /* ── data ───────────────────────────────────────────────── */
  const [problems, setProblems]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  /* ── view state ─────────────────────────────────────────── */
  const [view, setView]             = useState(VIEW_TOPICS);
  const [activeTopic, setActiveTopic] = useState(null);   // only for VIEW_TOPIC

  /* ── modals ─────────────────────────────────────────────── */
  const [showModal, setShowModal]           = useState(false);
  const [modalMode, setModalMode]           = useState("create");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /* ── fetch ──────────────────────────────────────────────── */
  useEffect(() => { fetchProblems(); }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await getAllProblems();
      setProblems(res.data.problems);
    } catch {
      setError("Failed to load problems.");
    } finally {
      setLoading(false);
    }
  };

  /* ── modal save ─────────────────────────────────────────── */
  const handleModalSave = async ({ mode, problemData }) => {
    if (mode === "create") {
      const res = await createProblem(problemData);
      toast.success("Problem created successfully.");
      fetchProblems();
      return res.data.problem;
    } else {
      await updateProblem(selectedProblem.id, problemData);
      toast.success("Problem updated successfully.");
      setSelectedProblem(null);
      await fetchProblems();
      return { id: selectedProblem.id };
    }
  };

  /* ── delete ─────────────────────────────────────────────── */
  const handleDeleteProblem = async () => {
    try {
      await deleteProblem(selectedProblem.id);
      toast.success("Problem deleted successfully.");
      setShowDeleteDialog(false);
      setSelectedProblem(null);
      await fetchProblems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete problem.");
    }
  };

  /* ── admin callbacks passed to ProblemsList ─────────────── */
  const handleEdit = (problem) => {
    setSelectedProblem(problem);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = (problem) => {
    setSelectedProblem(problem);
    setShowDeleteDialog(true);
  };

  /* ── navigate to topic ──────────────────────────────────── */
  const handleSelectTopic = (topic) => {
    setActiveTopic(topic);
    setView(VIEW_TOPIC);
  };

  /* ── topic problems ─────────────────────────────────────── */
  const topicProblems = activeTopic
    ? problems.filter((p) => (p.topic || "").toLowerCase() === activeTopic.toLowerCase())
    : [];

  /* ── breadcrumb label ───────────────────────────────────── */
  const topicMeta = activeTopic ? getTopicMeta(activeTopic) : null;

  /* ── error / loading ────────────────────────────────────── */
  if (!loading && error) {
    return (
      <div className="pbp-page">
        <div className="pb-empty-state" style={{ minHeight: "60vh", justifyContent: "center" }}>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="pb-solve-btn" style={{ marginTop: 16 }} onClick={fetchProblems}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────── render ────────────────────────────── */
  return (
    <div className="pbp-page">

      {/* ── top nav bar ─────────────────────────────────────── */}
      <header className="pbp-nav">
        <div className="pbp-nav-left">
          <button
            className="pbp-back-btn"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to Dashboard"
          >
            <FiArrowLeft size={15} />
          </button>

          <div className="pbp-logo">
            <FiCode size={16} />
            <span>EasyCode</span>
          </div>

          {/* breadcrumb */}
          <nav className="pbp-breadcrumb" aria-label="breadcrumb">
            <button
              className={`pbp-bc-item ${view === VIEW_TOPICS ? "pbp-bc-item--active" : ""}`}
              onClick={() => setView(VIEW_TOPICS)}
            >
              Problems
            </button>

            {(view === VIEW_ALL) && (
              <>
                <span className="pbp-bc-sep">›</span>
                <span className="pbp-bc-item pbp-bc-item--active">All Problems</span>
              </>
            )}

            {(view === VIEW_TOPIC && topicMeta) && (
              <>
                <span className="pbp-bc-sep">›</span>
                <span className="pbp-bc-item pbp-bc-item--active">
                  {topicMeta.icon} {topicMeta.label}
                </span>
              </>
            )}
          </nav>
        </div>

        <div className="pbp-nav-right">
          {isAdmin && (
            <button
              className="pbp-create-btn"
              onClick={() => {
                setModalMode("create");
                setSelectedProblem(null);
                setShowModal(true);
              }}
            >
              <FiPlusSquare size={14} />
              Create Problem
            </button>
          )}
        </div>
      </header>

      {/* ── page hero ───────────────────────────────────────── */}
      <div className="pbp-hero">
        <div className="pbp-hero-left">
          {view === VIEW_TOPIC && topicMeta && (
            <button
              className="pbp-topic-back"
              onClick={() => setView(VIEW_TOPICS)}
              aria-label="Back to Topics"
            >
              <FiArrowLeft size={13} /> Back to Topics
            </button>
          )}

          <h1 className="pbp-title">
            {view === VIEW_TOPICS && "Browse by Topic"}
            {view === VIEW_ALL   && "All Problems"}
            {view === VIEW_TOPIC && topicMeta && `${topicMeta.icon} ${topicMeta.label}`}
          </h1>

          <p className="pbp-subtitle">
            {view === VIEW_TOPICS && `${problems.length} problems across all topics`}
            {view === VIEW_ALL    && `${problems.length} problems total`}
            {view === VIEW_TOPIC  && `${topicProblems.length} problem${topicProblems.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* ── view toggle ───────────────────────────────────── */}
        <div className="pbp-view-toggle" role="group" aria-label="Switch view">
          <button
            className={`pbp-toggle-btn ${(view === VIEW_TOPICS || view === VIEW_TOPIC) ? "pbp-toggle-btn--active" : ""}`}
            onClick={() => setView(VIEW_TOPICS)}
            title="Browse by Topic"
          >
            <FiGrid size={14} />
            <span>Browse by Topic</span>
          </button>
          <button
            className={`pbp-toggle-btn ${view === VIEW_ALL ? "pbp-toggle-btn--active" : ""}`}
            onClick={() => setView(VIEW_ALL)}
            title="View All Problems"
          >
            <FiList size={14} />
            <span>All Problems</span>
          </button>
        </div>
      </div>

      {/* ── main content ────────────────────────────────────── */}
      <main className="pbp-main">

        {/* ── TOPIC GRID ──────────────────────────────────── */}
        {view === VIEW_TOPICS && (
          loading ? (
            <div className="tg-grid tg-grid--loading">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="tg-card tg-card--skeleton">
                  <div className="tg-skel-icon" />
                  <div className="tg-skel-name" />
                  <div className="tg-skel-count" />
                  <div className="tg-skel-bar" />
                </div>
              ))}
            </div>
          ) : (
            <TopicGrid problems={problems} onSelectTopic={handleSelectTopic} />
          )
        )}

        {/* ── ALL PROBLEMS ────────────────────────────────── */}
        {view === VIEW_ALL && (
          <ProblemsList
            problems={problems}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        )}

        {/* ── SINGLE TOPIC ────────────────────────────────── */}
        {view === VIEW_TOPIC && (
          <ProblemsList
            problems={topicProblems}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        )}

      </main>

      {/* ── modals (preserved exactly as before) ────────────── */}
      <ProblemModal
        isOpen={showModal}
        mode={modalMode}
        problem={selectedProblem}
        onClose={() => { setShowModal(false); setSelectedProblem(null); }}
        onSave={handleModalSave}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        problem={selectedProblem}
        onClose={() => { setShowDeleteDialog(false); setSelectedProblem(null); }}
        onConfirm={handleDeleteProblem}
      />
    </div>
  );
}

export default Problems;
