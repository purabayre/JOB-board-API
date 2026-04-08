const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const historyRoutes = require("./routes/history");
require("./cron/scheduler");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res, next) => {
  res.send("Server is working");
});
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/history", historyRoutes);

app.use(errorHandler);

module.exports = app;
