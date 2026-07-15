const express = require("express");

const { runCode, submitSolution } = require("../controllers/compilerController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/run", runCode);
router.post("/submit", authenticate, submitSolution);

module.exports = router;
