const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// DB connection
require("./config/db");

// Routes
const authRoutes = require("./routes/auth");
const candidateRoutes = require("./routes/candidates");
const voteRoutes = require("./routes/votes");
const feedbackRoutes = require("./routes/feedback");
const adminRoutes = require("./routes/admin");
//const notificationRoutes = require("./routes/notifications");
const settingsRoutes = require("./routes/settings");
const announcementRoutes = require("./routes/announcements");

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
});

app.set("io", io);

// Middleware
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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔍 DEBUG: Log ALL incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - Body:`, req.body);
  next();
});

// REAL-TIME TURNOUT
app.set("broadcastTurnout", async () => {
  try {
    const pool = require("./config/db");

    const result = await pool.request().query(`
      SELECT 
        COUNT(DISTINCT VoterId) AS VotedCount,
        (SELECT COUNT(*) FROM dbo.Voters) AS TotalVoters
      FROM dbo.Votes
    `);

    const voted = result.recordset[0].VotedCount || 0;
    const total = result.recordset[0].TotalVoters || 1;
    const percent = Number(((voted / total) * 100).toFixed(2));

    io.emit("turnoutUpdate", { voted, total, percent });
  } catch (err) {
    console.error("Turnout broadcast error:", err);
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
//app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/announcements", announcementRoutes);

// 🔍 DEBUG: Confirm routes loaded
console.log("✅ Auth routes loaded");
console.log("📍 Testing if /send-otp exists:", typeof authRoutes);

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🔍 DEBUG: Catch-all for unmatched routes
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Route not found",
    path: req.url,
    method: req.method 
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));