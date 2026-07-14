const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute({
    code,
    input,
    sourceFileName: "solution.c",
    executableName: "solution.out",
    compiler: "gcc",
  });
}

module.exports = { execute };