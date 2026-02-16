// routes/votes.js - FIXED: Using correct req.user field

const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ================= SUBMIT VOTE ================= */
router.post("/", authenticateToken, async (req, res) => {
  let transaction;

  try {
    // ✅ FIXED: Use req.user.voterId instead of req.user.id
    const voterId = req.user.voterId || req.user.id;
    
    console.log("=== VOTE SUBMISSION DEBUG ===");
    console.log("User object:", req.user);
    console.log("VoterId extracted:", voterId);

    if (!voterId) {
      console.error("❌ VoterId is NULL or undefined!");
      return res.status(400).json({ error: "Invalid user session. Please log in again." });
    }

    const { votes } = req.body;

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: "No votes provided" });
    }

    // Check if already voted
    const existing = await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .query("SELECT COUNT(*) AS Count FROM dbo.Votes WHERE VoterId = @VoterId");

    if (existing.recordset[0].Count > 0) {
      return res.status(400).json({ error: "You have already voted" });
    }

    // Begin transaction
    transaction = pool.transaction();
    await transaction.begin();

    console.log(`✅ Inserting ${votes.length} votes for VoterId: ${voterId}`);

    // Insert each vote
    for (const vote of votes) {
      console.log(`  - Position: ${vote.position}, CandidateId: ${vote.candidateId}`);
      
      await transaction
        .request()
        .input("VoterId", sql.Int, voterId)
        .input("CandidateId", sql.Int, vote.candidateId)
        .query(`
          INSERT INTO dbo.Votes (VoterId, CandidateId, VotedAt)
          VALUES (@VoterId, @CandidateId, GETDATE())
        `);
    }

    await transaction.commit();
    console.log("✅ Vote submission successful!");

    // Broadcast turnout update
    const broadcastTurnout = req.app.get("broadcastTurnout");
    if (broadcastTurnout) await broadcastTurnout();

    res.json({ success: true, message: "Votes submitted successfully" });

  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back");
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }
    
    console.error("❌ Vote submission error:", err);
    res.status(500).json({ error: "Vote submission failed" });
  }
});

/* ================= STATUS ================= */
router.get("/status", authenticateToken, async (req, res) => {
  try {
    // ✅ FIXED: Use req.user.voterId
    const voterId = req.user.voterId || req.user.id;

    const userVote = await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .query("SELECT COUNT(*) AS Count FROM dbo.Votes WHERE VoterId = @VoterId");

    const votedCount = await pool
      .request()
      .query("SELECT COUNT(DISTINCT VoterId) AS VotedCount FROM dbo.Votes");

    const totalVoters = await pool
      .request()
      .query("SELECT COUNT(*) AS TotalVoters FROM dbo.Voters");

    const total = totalVoters.recordset[0].TotalVoters || 1;
    const voted = votedCount.recordset[0].VotedCount || 0;

    res.json({
      hasVoted: userVote.recordset[0].Count > 0,
      votedCount: voted,
      totalVoters: total,
      turnoutPercent: parseFloat(((voted / total) * 100).toFixed(2)),
    });
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "Status check failed" });
  }
});

/* ================= SLIP ================= */
router.get("/slip", authenticateToken, async (req, res) => {
  try {
    // ✅ FIXED: Use req.user.voterId
    const voterId = req.user.voterId || req.user.id;

    const voter = await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .query(`
        SELECT FullName, Email, StudentId
        FROM dbo.Voters
        WHERE VoterId = @VoterId
      `);

    if (voter.recordset.length === 0) {
      return res.status(404).json({ error: "Voter not found" });
    }

    const votes = await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .query(`
        SELECT 
          v.VoteId,
          v.VotedAt,
          c.Name AS CandidateName,
          c.Position
        FROM dbo.Votes v
        JOIN dbo.Candidates c ON v.CandidateId = c.CandidateId
        WHERE v.VoterId = @VoterId
        ORDER BY c.Position
      `);

    if (votes.recordset.length === 0) {
      return res.status(404).json({ error: "You have not voted yet." });
    }

    // Convert UTC → IST
    const formattedVotes = votes.recordset.map((v) => ({
      ...v,
      VotedAt: new Date(v.VotedAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    }));

    res.json({
      voter: voter.recordset[0].FullName,
      email: voter.recordset[0].Email,
      studentId: voter.recordset[0].StudentId,
      votes: formattedVotes,
    });
  } catch (err) {
    console.error("Slip generation error:", err);
    res.status(500).json({ error: "Slip generation failed" });
  }
});

/* ================= RESULTS ================= */
router.get("/results", authenticateToken, async (req, res) => {
  try {
    const results = await pool.request().query(`
      SELECT 
        c.CandidateId,
        c.Name,
        c.Position,
        c.Gender,
        COUNT(v.VoteId) AS TotalVotes
      FROM dbo.Candidates c
      LEFT JOIN dbo.Votes v ON c.CandidateId = v.CandidateId
      WHERE c.IsActive = 1
      GROUP BY c.CandidateId, c.Name, c.Position, c.Gender
      ORDER BY c.Position, TotalVotes DESC
    `);

    res.json(results.recordset);
  } catch (err) {
    console.error("Results fetch error:", err);
    res.status(500).json({ error: "Results fetch failed" });
  }
});

module.exports = router;