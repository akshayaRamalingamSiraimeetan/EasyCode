const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute({
    code,
    input,
    extension: "cpp",
    compiler: "g++",
  });
}

module.exports = {
  execute,
};
