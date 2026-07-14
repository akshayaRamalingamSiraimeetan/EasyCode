const judge = require("../../../judge/judgeService");

const runCode = async (req, res) => {
  try {
    const { language, code, input } = req.body;

    const result = await judge.execute(language, code, input);

    return res.status(200).json({
      success: result.status === "success",
      status: result.status,
      output: result.stdout,
      error: result.stderr,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "internal_error",
      message: error.message,
    });
  }
};

module.exports = { runCode };
