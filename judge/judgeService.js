const pythonRunner = require("./runners/pythonRunner");

async function execute(language, code, input) {
  switch (language) {
    case "python":
      return pythonRunner.execute(code, input);

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

module.exports = {
  execute,
};