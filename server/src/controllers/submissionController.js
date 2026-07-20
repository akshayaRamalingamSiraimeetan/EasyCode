const Submission = require("../models/Submission");

/*
 * GET /api/submissions/me
 * Returns the authenticated user's submissions, newest first.
 * Supports ?page=1&limit=20
 */
const getMySubmissions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find({ userId: req.user.id })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-_id -__v -code"), // omit code from list view for performance
      Submission.countDocuments({ userId: req.user.id }),
    ]);

    return res.status(200).json({
      success: true,
      submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/*
 * GET /api/submissions/problem/:problemId
 * Returns the authenticated user's submissions for one problem, newest first.
 */
const getSubmissionsByProblem = async (req, res) => {
  try {
    const { problemId } = req.params;

    const submissions = await Submission.find({
      userId: req.user.id,
      problemId,
    })
      .sort({ submittedAt: -1 })
      .select("-_id -__v -code");

    return res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/*
 * GET /api/submissions/:id
 * Returns a single submission including the full code.
 * Normal users can only access their own submission.
 * Admins can access any submission.
 */
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findOne({ id }).select("-_id -__v");

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found." });
    }

    // Ownership check — admins bypass it.
    if (req.user.role !== "admin" && submission.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this submission.",
      });
    }

    return res.status(200).json({ success: true, submission });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = { getMySubmissions, getSubmissionsByProblem, getSubmissionById };
