const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const { getHint } = require("../controllers/aiController");

const router = express.Router();

// POST /api/ai/hint
// Auth is enforced here — the AI service itself is not exposed to the internet
router.post("/hint", authenticate, getHint);

// Future routes — add controllers when implemented:
// router.post("/review",     authenticate, getReview);
// router.post("/debug",      authenticate, getDebug);
// router.post("/explain",    authenticate, getExplanation);
// router.post("/editorial",  authenticate, getEditorial);
// router.post("/complexity", authenticate, getComplexity);
// router.post("/chat",       authenticate, chat);

module.exports = router;
