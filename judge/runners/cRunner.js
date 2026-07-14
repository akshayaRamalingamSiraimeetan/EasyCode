const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute({
    code,
    input,
    sourceFileName: "solution.c",
    executableName: "solution.exe",
    compiler: "gcc",
  });
}

module.exports = { execute };
