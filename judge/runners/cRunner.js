const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute(
    code,
    input,
    "c",
    "gcc"
  );
}

module.exports = {
  execute,
};