const express = require("express");

const { register, login, getCurrentUser } = require("../controllers/authController");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me",authenticate,getCurrentUser);
module.exports = router;