/**
 * Problems page — two-view design (Browse by Topic / All Problems).
 * Uses AppNavbar for consistent navigation across the app.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiGrid, FiList, FiPlus } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import {
  getAllProblems,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../services/problem";
import TopicGrid, { getTopicMeta } from "../components/TopicGrid";
import ProblemsList from "../components/ProblemsList";
import ProblemModal from "../components/ProblemModal";
import DeleteDialog from "../components/DeleteDialog";
import AppNavbar from "../components/AppNavbar";

/* ── view modes ─────────────────────────────────────────── */
const VIEW_TOPICS = "topics";
const VIEW_ALL    = "all";
const VIEW_TOPIC  = "topic";

/* ─────────────────────────────────────────────────────────── */

export default function Problems() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = user?.role === "admin";

  /* ── data ──────────────────────────────────────────────── */
  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  /* ── view ──────────────────────────────────────────────── */
  const [view,        setView]        = useState(VIEW_TOPICS);
  const [activeTopic, setActiveTopic] = useState(null);

  /* ── modals ────────────────────────────────────────────── */
  const [showModal,        setShowModal]        = useState(false);
  const [modalMode,        setModalMode]        = useState("create");
  const [selectedProblem,  setSelectedProblem]  = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /* ── fetch ─────────────────────────────────────────────── */
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

  /* ── modal save ────────────────────────────────────────── */
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

  /* ── delete ────────────────────────────────────────────── */
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

  /* ── admin handlers ────────────────────────────────────── */
  const handleEdit = (problem) => {
    setSelectedProblem(problem);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = (problem) => {
    setSelectedProblem(problem);
    setShowDeleteDialog(true);
  };

  /* ── topic helpers ─────────────────────────────────────── */
  const handleSelectTopic = (topic) => {
    setActiveTopic(topic);
    setView(VIEW_TOPIC);
  };

  const topicProblems = activeTopic
    ? problems.filter(
        (p) => (p.topic || "").toLowerCase() === activeTopic.toLowerCase()
      )
    : [];

  const topicMeta = activeTopic ? getTopicMeta(activeTopic) : null;

  /* ── breadcrumb title for navbar ───────────────────────── */
  const navTitle =
    view === VIEW_ALL   ? "All Problems" :
    view === VIEW_TOPIC ? topicMeta?.label :
    null; // "Problems" is already a nav link — no extra breadcrumb on the default view

  /* ── navbar actions slot: view toggle + admin create ───── */
  const navActions = (
    <div className="prob-nav-actions">
      {/* view toggle */}
      <div className="pbp-view-toggle" role="group" aria-label="Switch view">
        <button
          className={`pbp-toggle-btn${
            view === VIEW_TOPICS || view === VIEW_TOPIC ? " pbp-toggle-btn--active" : ""
          }`}
          onClick={() => setView(VIEW_TOPICS)}
          title="Browse by Topic"
        >
          <FiGrid size={13} />
          <span>By Topic</span>
        </button>
        <button
          className={`pbp-toggle-btn${view === VIEW_ALL ? " pbp-toggle-btn--active" : ""}`}
          onClick={() => setView(VIEW_ALL)}
          title="View All Problems"
        >
          <FiList size={13} />
          <span>All Problems</span>
        </button>
      </div>

      {/* admin create button */}
      {isAdmin && (
        <button
          className="pbp-create-btn"
          onClick={() => {
            setModalMode("create");
            setSelectedProblem(null);
            setShowModal(true);
          }}
        >
          <FiPlus size={14} />
          Create Problem
        </button>
      )}
    </div>
  );

  /* ── error state ───────────────────────────────────────── */
  if (!loading && error) {
    return (
      <div className="pbp-page">
        <AppNavbar title="Problems" actions={navActions} />
        <div className="pb-empty-state" style={{ minHeight: "60vh" }}>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="pb-solve-btn" style={{ marginTop: 16 }} onClick={fetchProblems}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="pbp-page">

      {/* ── shared app navbar ──────────────────────────────── */}
      <AppNavbar title={navTitle} actions={navActions} />

      {/* ── page hero ───────────────────────────────────────── */}
      <div className="pbp-hero">
        <div className="pbp-hero-left">
          {view === VIEW_TOPIC && (
            <button className="pbp-topic-back" onClick={() => setView(VIEW_TOPICS)}>
              <FiArrowLeft size={12} />
              Back to Topics
            </button>
          )}

          <h1 className="pbp-title">
            {view === VIEW_TOPICS && "Browse by Topic"}
            {view === VIEW_ALL    && "All Problems"}
            {view === VIEW_TOPIC  && topicMeta?.label}
          </h1>

          <p className="pbp-subtitle">
            {view === VIEW_TOPICS &&
              `${problems.length} problems across ${
                new Set(problems.map((p) => (p.topic || "").toLowerCase())).size
              } topics`}
            {view === VIEW_ALL   && `${problems.length} problems total`}
            {view === VIEW_TOPIC &&
              `${topicProblems.length} problem${topicProblems.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* ── content ─────────────────────────────────────────── */}
      <main className="pbp-main">

        {view === VIEW_TOPICS && (
          loading ? (
            <div className="tg-grid">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="tg-card tg-card--skel">
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

        {view === VIEW_ALL && (
          <ProblemsList
            problems={problems}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        )}

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

      {/* modals — logic unchanged */}
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
