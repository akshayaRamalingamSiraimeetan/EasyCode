const User = require("../models/User");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");

exports.getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalSubmissions, totalProblems] = await Promise.all([
      User.estimatedDocumentCount(),
      Submission.estimatedDocumentCount(),
      Problem.estimatedDocumentCount(),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSubmissions,
        totalProblems,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform statistics.",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;

    // Build search query if provided
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get users with basic info (excluding password)
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // For each user, get their submission statistics
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const submissions = await Submission.find({ userId: user.id });
        
        const stats = {
          totalSubmissions: submissions.length,
          accepted: submissions.filter(s => s.verdict === 'accepted').length,
          wrongAnswer: submissions.filter(s => s.verdict === 'wrong_answer').length,
          runtimeError: submissions.filter(s => s.verdict === 'runtime_error').length,
          compilationError: submissions.filter(s => s.verdict === 'compilation_error').length,
          timeLimit: submissions.filter(s => s.verdict === 'time_limit_exceeded').length,
          outputLimit: submissions.filter(s => s.verdict === 'output_limit_exceeded').length,
        };

        // Count unique problems solved (accepted submissions)
        const solvedProblems = new Set(
          submissions
            .filter(s => s.verdict === 'accepted')
            .map(s => s.problemId)
        ).size;

        // Get last submission date for "last active"
        const lastSubmission = submissions.length > 0 
          ? Math.max(...submissions.map(s => new Date(s.submittedAt).getTime()))
          : null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastActive: lastSubmission ? new Date(lastSubmission) : null,
          stats: {
            problemsSolved: solvedProblems,
            acceptanceRate: stats.totalSubmissions > 0 
              ? Math.round((stats.accepted / stats.totalSubmissions) * 100) 
              : 0,
            ...stats
          }
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const user = await User.findOne({ id: userId }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get recent submissions (last 20)
    const recentSubmissions = await Submission.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(20);

    // Calculate comprehensive statistics
    const allSubmissions = await Submission.find({ userId });
    const stats = {
      totalSubmissions: allSubmissions.length,
      accepted: allSubmissions.filter(s => s.verdict === 'accepted').length,
      wrongAnswer: allSubmissions.filter(s => s.verdict === 'wrong_answer').length,
      runtimeError: allSubmissions.filter(s => s.verdict === 'runtime_error').length,
      compilationError: allSubmissions.filter(s => s.verdict === 'compilation_error').length,
      timeLimit: allSubmissions.filter(s => s.verdict === 'time_limit_exceeded').length,
      outputLimit: allSubmissions.filter(s => s.verdict === 'output_limit_exceeded').length,
    };

    // Count unique problems solved
    const problemsSolved = new Set(
      allSubmissions
        .filter(s => s.verdict === 'accepted')
        .map(s => s.problemId)
    ).size;

    // Last active date
    const lastActive = allSubmissions.length > 0 
      ? Math.max(...allSubmissions.map(s => new Date(s.submittedAt).getTime()))
      : null;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastActive: lastActive ? new Date(lastActive) : null,
        stats: {
          problemsSolved,
          acceptanceRate: stats.totalSubmissions > 0 
            ? Math.round((stats.accepted / stats.totalSubmissions) * 100) 
            : 0,
          ...stats
        },
        recentSubmissions
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details.",
    });
  }
};
