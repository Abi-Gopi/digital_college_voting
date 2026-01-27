const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// ✅ Initialize DB connection
require("./config/db");

// ✅ Import routes
const authRoutes = require("./routes/auth");
const candidateRoutes = require("./routes/candidates");
const voteRoutes = require("./routes/votes");
const feedbackRoutes = require("./routes/feedback");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");
const settingsRoutes = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});


io.on("connection", (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`🔴 Disconnected: ${socket.id}`));
});

// Make socket available to routes
app.set("io", io);

// ✅ Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);



// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server and DB running" });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
