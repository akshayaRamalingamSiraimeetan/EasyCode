const compiledRunner = require("./compiledRunner");

async function execute(code, input) {
  return compiledRunner.execute(code, input, "cpp", "g++");
}

module.exports = {
  execute,
};