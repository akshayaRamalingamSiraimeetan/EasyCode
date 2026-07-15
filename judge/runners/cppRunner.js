const compiledRunner = require("./compiledRunner");

const CPP_CONFIG = {
  sourceFileName: "solution.cpp",
  executableName: "solution.out",
  compiler: "g++",
};

async function execute(code, input) {
  return compiledRunner.execute({ code, input, ...CPP_CONFIG });
}

async function judge(code, testCases) {
  return compiledRunner.judge(code, testCases, CPP_CONFIG);
}

module.exports = { execute, judge };
