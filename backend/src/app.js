const express = require("express");

const logger = require("./middleware/logger.middleware");
const errorHandler = require("./middleware/error.middleware");
const healthRoutes = require("./routes/health.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

app.use(express.json());

app.use(logger);

app.use("/", healthRoutes);
app.use("/notifications", notificationRoutes);

app.use(errorHandler);

module.exports = app;