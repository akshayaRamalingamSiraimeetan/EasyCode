const pythonRunner = require("./runners/pythonRunner");
const cRunner = require("./runners/cRunner");

async function execute(language, code, input) {
  switch (language) {
    case "python":
      return pythonRunner.execute(code, input);
    
    case "c":
        return cRunner.execute(code,input);

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

module.exports = {
  execute,
};