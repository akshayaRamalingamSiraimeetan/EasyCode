const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute({
    code,
    input,
    extension: "c",
    compiler: "gcc",
  });
}

module.exports = {
  execute,
};
