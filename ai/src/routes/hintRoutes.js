const express = require("express");
const { getHint } = require("../controllers/hintController");
const validateHintRequest = require("../middleware/validateHintRequest");

const router = express.Router();

// POST /hint
router.post("/", validateHintRequest, getHint);

module.exports = router;
