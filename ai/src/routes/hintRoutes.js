const express = require("express");
const { getHint } = require("../controllers/hintController");
const validateHintRequest = require("../middleware/validateHintRequest");

const router = express.Router();

// POST /hint
// [DIAGNOSTIC] Inline logging middleware fires before validation — confirms the request reached the AI service
router.post(
  "/",
  (req, _res, next) => {
    console.log("========== /hint ==========");
    console.log("[HintRoute] Incoming request.");
    console.log("[HintRoute] Time:", new Date().toISOString());
    next();
  },
  validateHintRequest,
  getHint
);

module.exports = router;
