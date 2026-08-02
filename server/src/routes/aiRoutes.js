// [DIAGNOSTIC] Fires at require() time — confirms this file was loaded by the running container
console.log("[AI ROUTES] module loaded");

const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const { getHint } = require("../controllers/aiController");

const router = express.Router();

// [DIAGNOSTIC] Fires immediately after router creation
console.log("[AI ROUTES] router created");

// POST /api/ai/hint
// Auth is enforced here — the AI service itself is not exposed to the internet
router.post(
  "/hint",
  // [DIAGNOSTIC] Confirms the route matched and Express handed off to the middleware chain
  (req, _res, next) => {
    console.log("========== AI ROUTE ==========");
    console.log("[Route] /api/ai/hint matched");
    next();
  },
  authenticate,
  // [DIAGNOSTIC] Confirms authenticate() called next() and did not reject the request
  (_req, _res, next) => {
    console.log("[Route] authenticate() completed");
    next();
  },
  getHint
);

// Future routes — add controllers when implemented:
// router.post("/review",     authenticate, getReview);
// router.post("/debug",      authenticate, getDebug);
// router.post("/explain",    authenticate, getExplanation);
// router.post("/editorial",  authenticate, getEditorial);
// router.post("/complexity", authenticate, getComplexity);
// router.post("/chat",       authenticate, chat);

// [DIAGNOSTIC] Fires just before export — prints every registered route path and method
console.log("[AI ROUTES] registered routes:");
console.log(router.stack.map((r) => ({ path: r.route?.path, methods: r.route?.methods })));

module.exports = router;
