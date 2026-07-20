/**
 * Validates the incoming hint request body.
 *
 * Required fields:
 *   - problem        : object with at least { title, description, difficulty }
 *   - language       : non-empty string
 *   - hintLevel      : integer 1, 2, or 3
 *
 * Optional:
 *   - userCode       : string (may be empty if user hasn't written anything yet)
 */
const validateHintRequest = (req, res, next) => {
  const { problem, language, hintLevel } = req.body;

  if (!problem || typeof problem !== "object") {
    return res.status(400).json({
      success: false,
      message: "Field 'problem' is required and must be an object.",
    });
  }

  if (!problem.title || !problem.description || !problem.difficulty) {
    return res.status(400).json({
      success: false,
      message:
        "Field 'problem' must contain: title, description, and difficulty.",
    });
  }

  if (!language || typeof language !== "string" || language.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Field 'language' is required and must be a non-empty string.",
    });
  }

  const level = Number(hintLevel);
  if (![1, 2, 3].includes(level)) {
    return res.status(400).json({
      success: false,
      message: "Field 'hintLevel' must be 1, 2, or 3.",
    });
  }

  // Normalise so controller always sees a number
  req.body.hintLevel = level;

  next();
};

module.exports = validateHintRequest;
