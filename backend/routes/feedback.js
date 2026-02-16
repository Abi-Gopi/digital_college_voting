// backend/routes/feedback.js - FINAL FIX for Analytics

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const { authenticateToken, isAdmin } = require("../middleware/auth");

/* ====================================
   SUBMIT FEEDBACK (Authenticated Users)
   ==================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      candidateSatisfaction,
      keyIssue,
      processTrust,
      isRegisteredVoter,
      recommendation,
    } = req.body;

    const voterId = req.user.voterId || req.user.id;

    const ipAddress = req.ip || req.connection.remoteAddress;

    const existingFeedback = await pool.request()
      .input("voterId", voterId)
      .query("SELECT FeedbackId FROM dbo.Feedback WHERE VoterId = @voterId");

    if (existingFeedback.recordset.length > 0) {
      return res.status(400).json({ error: "You have already submitted feedback" });
    }

    await pool.request()
      .input("voterId", voterId)
      .input("candidateSatisfaction", candidateSatisfaction || null)
      .input("keyIssue", keyIssue || null)
      .input("processTrust", processTrust || null)
      .input("isRegisteredVoter", isRegisteredVoter || false)
      .input("recommendation", recommendation || null)
      .input("ipAddress", ipAddress)
      .query(`
        INSERT INTO dbo.Feedback (
          VoterId,
          Q1_CandidateSatisfaction,
          Q2_KeyIssue,
          Q3_ProcessTrust,
          Q4_IsRegisteredVoter,
          Recommendation,
          IPAddress,
          IsReviewed,
          CreatedAt
        )
        VALUES (
          @voterId,
          @candidateSatisfaction,
          @keyIssue,
          @processTrust,
          @isRegisteredVoter,
          @recommendation,
          @ipAddress,
          0,
          GETDATE()
        )
      `);

    res.json({ success: true, message: "Feedback submitted successfully" });

  } catch (err) {
    console.error("Submit feedback error:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

/* ====================================
   CHECK IF USER ALREADY SUBMITTED FEEDBACK
   ==================================== */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.voterId || req.user.id;

    const result = await pool.request()
      .input("voterId", voterId)
      .query("SELECT FeedbackId FROM dbo.Feedback WHERE VoterId = @voterId");

    res.json({ hasFeedback: result.recordset.length > 0 });

  } catch (err) {
    console.error("Check feedback error:", err);
    res.status(500).json({ error: "Failed to check feedback status" });
  }
});

/* ====================================
   GET ALL FEEDBACK (Admin Only)
   ==================================== */
router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("=== Fetching all feedback ===");

    const result = await pool.request().query(`
      SELECT 
        f.FeedbackId,
        f.VoterId,
        v.FullName,
        v.Email,
        v.StudentId,
        f.Q1_CandidateSatisfaction,
        f.Q2_KeyIssue,
        f.Q3_ProcessTrust,
        f.Q4_IsRegisteredVoter,
        f.Recommendation,
        f.IPAddress,
        f.IsReviewed,
        f.ReviewedBy,
        f.ReviewedAt,
        f.CreatedAt
      FROM dbo.Feedback f
      INNER JOIN dbo.Voters v ON f.VoterId = v.VoterId
      ORDER BY f.CreatedAt DESC
    `);

    console.log(`✅ Found ${result.recordset.length} feedback entries`);
    res.json(result.recordset);

  } catch (err) {
    console.error("Get feedback error:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

/* ====================================
   MARK FEEDBACK AS REVIEWED (Admin Only)
   ==================================== */
router.put("/:id/review", authenticateToken, isAdmin, async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const reviewerEmail = req.user.email || "Admin";

    await pool.request()
      .input("feedbackId", feedbackId)
      .input("reviewedBy", reviewerEmail)
      .query(`
        UPDATE dbo.Feedback
        SET 
          IsReviewed = 1,
          ReviewedBy = @reviewedBy,
          ReviewedAt = GETDATE()
        WHERE FeedbackId = @feedbackId
      `);

    res.json({ success: true, message: "Feedback marked as reviewed" });

  } catch (err) {
    console.error("Review feedback error:", err);
    res.status(500).json({ error: "Failed to mark as reviewed" });
  }
});

/* ====================================
   GET FEEDBACK ANALYTICS (Admin Only) - FIXED RESPONSE FORMAT
   ==================================== */
router.get("/analytics", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("=== Fetching feedback analytics ===");

    // Summary stats
    const summaryResult = await pool.request().query(`
      SELECT 
        COUNT(*) AS TotalFeedback,
        AVG(CAST(Q1_CandidateSatisfaction AS FLOAT)) AS AvgSatisfaction,
        AVG(CAST(Q3_ProcessTrust AS FLOAT)) AS AvgTrust,
        SUM(CASE WHEN Q4_IsRegisteredVoter = 1 THEN 1 ELSE 0 END) AS RegisteredVoters,
        SUM(CASE WHEN IsReviewed = 1 THEN 1 ELSE 0 END) AS ReviewedCount
      FROM dbo.Feedback
    `);

    // Satisfaction distribution
    const satisfactionResult = await pool.request().query(`
      SELECT 
        Q1_CandidateSatisfaction AS Rating,
        COUNT(*) AS Count
      FROM dbo.Feedback
      WHERE Q1_CandidateSatisfaction IS NOT NULL
      GROUP BY Q1_CandidateSatisfaction
      ORDER BY Q1_CandidateSatisfaction
    `);

    // Trust distribution
    const trustResult = await pool.request().query(`
      SELECT 
        Q3_ProcessTrust AS Trust,
        COUNT(*) AS Count
      FROM dbo.Feedback
      WHERE Q3_ProcessTrust IS NOT NULL
      GROUP BY Q3_ProcessTrust
      ORDER BY Q3_ProcessTrust
    `);

    // Key issues (top 10)
    const issuesResult = await pool.request().query(`
      SELECT TOP 10
        Q2_KeyIssue,
        COUNT(*) AS Count
      FROM dbo.Feedback
      WHERE Q2_KeyIssue IS NOT NULL
      GROUP BY Q2_KeyIssue
      ORDER BY COUNT(*) DESC
    `);

    // ✅ FIX: Return in exact format frontend expects
    const response = {
      summary: summaryResult.recordset[0] || {},
      satisfactionDistribution: satisfactionResult.recordset || [],  // ✅ Correct key
      trustDistribution: trustResult.recordset || [],                 // ✅ Correct key
      issues: issuesResult.recordset || []
    };

    console.log("✅ Analytics response:", JSON.stringify(response, null, 2));
    res.json(response);

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;