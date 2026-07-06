const judge = require("../../../judge/judgeService");

const runCode = async (req, res) => {
  try {
    const { language, code, input } = req.body;

    const result = await judge.execute(language, code, input);

    return res.status(200).json({
      success: true,
      output: result.stdout,
      error: result.stderr,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  runCode,
};
