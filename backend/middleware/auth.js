// backend/middleware/auth.js - MIDDLEWARE FOR JWT VERIFICATION

const jwt = require("jsonwebtoken");

/* ====================================
   AUTHENTICATE TOKEN MIDDLEWARE
   ==================================== */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error("Token verification failed:", err);
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      // Attach user info to request
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

/* ====================================
   IS ADMIN MIDDLEWARE
   ==================================== */
const isAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ error: "Authorization failed" });
  }
};

/* ====================================
   EXPORTS
   ==================================== */
module.exports = {
  authenticateToken,
  isAdmin,
};