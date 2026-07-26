"use strict";

require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT ?? 7000;

app.listen(PORT, () => {
  console.log(`[Judge API] Listening on port ${PORT}`);
});
