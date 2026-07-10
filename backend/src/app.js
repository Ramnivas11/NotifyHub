const express = require("express");

const logger = require("./middleware/logger.middleware");
const healthRoutes = require("./routes/health.routes");

const app = express();

app.use(express.json());

app.use(logger);

app.use("/", healthRoutes);

module.exports = app;