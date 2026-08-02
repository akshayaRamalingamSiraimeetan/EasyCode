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

    // [DIAGNOSTIC] Confirm handler was reached after validation
    console.log("[HintController] Hint request received.");

    // [DIAGNOSTIC] Confirm validation middleware passed
    console.log("[HintController] Validation passed.");

    // [DIAGNOSTIC] Log before prompt construction
    console.log("[HintController] Building Gemini prompt...");
    const prompt = buildHintPrompt({ problem, language, userCode, hintLevel });

    // [DIAGNOSTIC] Log prompt size — never log prompt content (may contain user code)
    console.log("[HintController] Prompt built. Characters:", prompt.length);

    // [DIAGNOSTIC] Measure Gemini round-trip time
    console.log("[HintController] Calling Gemini API...");
    const start = Date.now();

    const hint = await geminiService.generate(prompt);

    // [DIAGNOSTIC] Log Gemini response time
    console.log("[HintController] Gemini responded. Elapsed:", Date.now() - start, "ms");

    // [DIAGNOSTIC] Confirm response is being sent back to Express server
    console.log("[HintController] Sending hint to Express.");

    return res.status(200).json({
      success: true,
      hint,
    });
  } catch (error) {
    // [DIAGNOSTIC] Full diagnostics on Gemini failure
    console.error("========== GEMINI REQUEST FAILED ==========");
    console.error("[HintController] Gemini request failed.");
    console.error("[HintController] error.message:", error.message);
    console.error("[HintController] error.stack:", error.stack);
    console.error("[HintController] error.status:", error.status ?? error.statusCode ?? "N/A");
    console.error(
      "[HintController] error.response body:",
      error.response?.data ?? error.errorDetails ?? "N/A"
    );

    return res.status(500).json({
      success: false,
      message: "Failed to generate hint. Please try again.",
    });
  }
};

module.exports = { getHint };
