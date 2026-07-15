const compiledRunner = require("./compiledRunner");

const C_CONFIG = {
  sourceFileName: "solution.c",
  executableName: "solution.out",
  compiler: "gcc",
};

async function execute(code, input) {
  return compiledRunner.execute({ code, input, ...C_CONFIG });
}

async function judge(code, testCases) {
  return compiledRunner.judge(code, testCases, C_CONFIG);
}

module.exports = { execute, judge };
