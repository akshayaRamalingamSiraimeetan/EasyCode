const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/authorizeAdmin");
const { getPlatformStats, getAllUsers, getUserDetails } = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication + admin role.
router.use(authenticate);
router.use(authorizeAdmin);

router.get("/stats", getPlatformStats);
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);

module.exports = router;
