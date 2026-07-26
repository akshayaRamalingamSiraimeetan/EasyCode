"use strict";

const { Router } = require("express");
const { validateExecute, validateJudge } = require("../middleware/validateRequest");
const { executeCode } = require("../controllers/executeController");
const { judgeCode }   = require("../controllers/judgeController");

const router = Router();

/**
 * POST /execute
 * Single-run execution against one input.
 */
router.post("/execute", validateExecute, executeCode);

/**
 * POST /judge
 * Multi-testcase judging — full verdict with pass/fail accounting.
 */
router.post("/judge", validateJudge, judgeCode);

module.exports = router;
