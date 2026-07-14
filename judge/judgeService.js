const pythonRunner = require("./runners/pythonRunner");
const cRunner = require("./runners/cRunner");
const cppRunner = require("./runners/cppRunner");
const javaRunner = require("./runners/javaRunner");

async function execute(language, code, input) {
  switch (language) {
    case "python":
      return pythonRunner.execute(code, input);

    case "c":
      return cRunner.execute(code, input);

    case "cpp":
      return cppRunner.execute(code, input);

    case "java":
      return javaRunner.execute(code, input);

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

module.exports = { execute };
