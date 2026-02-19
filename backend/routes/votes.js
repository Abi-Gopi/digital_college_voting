// routes/votes.js - FIXED: Correct parameter names for sp_CastVote

const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ================= SUBMIT VOTE ================= */
router.post("/", authenticateToken, async (req, res) => {
  let transaction;

  try {
    // ✅ Extract voterId from JWT
    const voterId = req.user.voterId || req.user.id || req.user.VoterId;
    
    console.log("=== VOTE SUBMISSION DEBUG ===");
    console.log("VoterId extracted:", voterId);

    if (!voterId) {
      console.error("❌ VoterId is NULL!");
      return res.status(400).json({ 
        error: "Invalid user session. Please log out and log in again." 
      });
    }

    const { votes } = req.body;

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: "No votes provided" });
    }

    // ✅ Get IP Address and User Agent for audit log
    const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    console.log(`✅ IP: ${ipAddress}, UserAgent: ${userAgent}`);

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

    console.log(`✅ Processing ${votes.length} votes for VoterId: ${voterId}`);

    // ✅ Insert each vote using stored procedure
    for (const vote of votes) {
      console.log(`  → Casting vote: Position=${vote.position}, CandidateId=${vote.candidateId}`);
      
      try {
        const request = transaction.request();
        
        // ✅ FIXED: Use @VoterId (input) not @VoteId (output)
        request.input("VoterId", sql.Int, voterId);
        request.input("CandidateId", sql.Int, vote.candidateId);
        request.input("IPAddress", sql.NVarChar(50), ipAddress);
        request.input("UserAgent", sql.NVarChar(255), userAgent);
        request.output("VoteId", sql.Int); // This is the output parameter
        
        await request.execute("sp_CastVote");
        
        console.log(`  ✅ Vote cast successfully for candidate ${vote.candidateId}`);
      } catch (spError) {
        console.error(`  ❌ Error casting vote for candidate ${vote.candidateId}:`, spError.message);
        throw spError;
      }
    }

    await transaction.commit();
    console.log("✅ All votes committed successfully!");

    // Broadcast turnout update
    const broadcastTurnout = req.app.get("broadcastTurnout");
    if (broadcastTurnout) {
      await broadcastTurnout();
    }

    res.json({ 
      success: true, 
      message: "Votes submitted successfully",
      votesCount: votes.length 
    });

  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
        console.log("⚠️ Transaction rolled back");
      } catch (rollbackErr) {
        console.error("❌ Rollback error:", rollbackErr);
      }
    }
    
    console.error("❌ Vote submission error:", err);
    res.status(500).json({ 
      error: err.message || "Vote submission failed"
    });
  }
});

/* ================= STATUS ================= */
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.voterId || req.user.id || req.user.VoterId;

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
    const voterId = req.user.voterId || req.user.id || req.user.VoterId;

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

    const formattedVotes = votes.recordset.map((v) => ({
      ...v,
      VotedAt: new Date(v.VotedAt).toISOString()
    // Produces: "2026-02-19T02:31:02.000Z"
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

/* ================= RESULTS - WITH PUBLICATION CHECK ================= */
router.get("/results", authenticateToken, async (req, res) => {
  try {
    console.log("=== Fetching Results ===");

    const statusCheck = await pool.request().query(`
      SELECT SettingValue
      FROM dbo.SystemSettings
      WHERE SettingKey = 'ResultsPublished'
    `);

    const isPublished = 
      statusCheck.recordset.length > 0 && 
      statusCheck.recordset[0].SettingValue === "true";

    console.log(`Results published status: ${isPublished}`);

    if (!isPublished) {
      console.log("❌ Results not published - returning empty array");
      return res.json([]);
    }

    console.log("✅ Results are published - fetching data");
    const result = await pool.request().query(`
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

    console.log(`Returning ${result.recordset.length} results`);
    res.json(result.recordset);

  } catch (error) {
    console.error("❌ Results fetch error:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

module.exports = router;