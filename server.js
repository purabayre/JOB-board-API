require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

connectDB();

const PORT = process.env.PORT || 2222;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION  Shutting down...");
  console.error(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log(" SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("💤 Process terminated!");
  });
});
