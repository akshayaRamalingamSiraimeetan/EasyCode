const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute({
    code,
    input,
    sourceFileName: "solution.cpp",
    executableName: "solution.out",
    compiler: "g++",
  });
}

module.exports = { execute };