const geminiService = require("../services/geminiService");
const buildHintPrompt = require("../prompts/hintPrompt");

/**
 * POST /hint
 *
 * Receives structured problem data from the main server,
 * builds a prompt, calls Gemini, and returns the hint.
 *
 * This controller has no knowledge of MongoDB or user auth —
 * that responsibility belongs to the main Express server.
 */
const getHint = async (req, res) => {
  try {
    const { problem, language, userCode, hintLevel } = req.body;

    const prompt = buildHintPrompt({ problem, language, userCode, hintLevel });

    const hint = await geminiService.generate(prompt);

    return res.status(200).json({
      success: true,
      hint,
    });
  } catch (error) {
    console.error("[HintController] Error generating hint:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to generate hint. Please try again.",
    });
  }
};

module.exports = { getHint };
