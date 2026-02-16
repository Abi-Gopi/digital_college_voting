// routes/admin.js - FINAL FIX: Correct column names for YOUR database

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const sql = require("mssql");

const { authenticateToken, isAdmin } = require("../middleware/auth");

/* ====================================
   GET ADMIN STATISTICS
   ==================================== */
router.get("/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const votersResult = await pool.request().query(`
      SELECT COUNT(*) AS TotalVoters FROM dbo.Voters
    `);

    const candidatesResult = await pool.request().query(`
      SELECT COUNT(*) AS TotalCandidates FROM dbo.Candidates
    `);

    const votesResult = await pool.request().query(`
      SELECT COUNT(*) AS TotalVotes FROM dbo.Votes
    `);

    const totalVoters = votersResult.recordset[0].TotalVoters || 0;
    const totalVotes = votesResult.recordset[0].TotalVotes || 0;
    
    const uniqueVotersResult = await pool.request().query(`
      SELECT COUNT(DISTINCT VoterId) AS UniqueVoters FROM dbo.Votes
    `);
    const uniqueVoters = uniqueVotersResult.recordset[0].UniqueVoters || 0;

    const turnoutPercent = totalVoters > 0 
      ? ((uniqueVoters / totalVoters) * 100).toFixed(2)
      : 0;

    const votesByPositionResult = await pool.request().query(`
      SELECT 
        c.Position,
        COUNT(v.VoteId) AS TotalVotes
      FROM dbo.Candidates c
      LEFT JOIN dbo.Votes v ON c.CandidateId = v.CandidateId
      GROUP BY c.Position
      ORDER BY c.Position
    `);

    res.json({
      totalVoters,
      totalCandidates: candidatesResult.recordset[0].TotalCandidates || 0,
      totalVotes,
      turnoutPercent: parseFloat(turnoutPercent),
      votesByPosition: votesByPositionResult.recordset,
    });

  } catch (err) {
    console.error("❌ Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/* ====================================
   CHECK RESULTS PUBLICATION STATUS
   ==================================== */
router.get("/results-status", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT SettingValue
      FROM dbo.SystemSettings
      WHERE SettingKey = 'ResultsPublished'
    `);

    const published =
      result.recordset.length > 0 &&
      result.recordset[0].SettingValue === "true";

    const publishedAtResult = await pool.request().query(`
      SELECT SettingValue
      FROM dbo.SystemSettings
      WHERE SettingKey = 'ResultsPublishedAt'
    `);

    const publishedAt =
      publishedAtResult.recordset.length > 0
        ? publishedAtResult.recordset[0].SettingValue
        : null;

    res.json({ published, publishedAt });

  } catch (err) {
    console.error("Results status error:", err);
    res.status(500).json({ error: "Failed to fetch results status" });
  }
});

/* ====================================
   PUBLISH RESULTS
   ==================================== */
router.post("/publish-results", authenticateToken, isAdmin, async (req, res) => {
  try {
    const now = new Date().toISOString();

    const checkResult = await pool.request().query(`
      SELECT COUNT(*) AS Count
      FROM dbo.SystemSettings
      WHERE SettingKey = 'ResultsPublished'
    `);

    if (checkResult.recordset[0].Count === 0) {
      await pool.request()
        .input("key", sql.NVarChar(100), "ResultsPublished")
        .input("value", sql.NVarChar(sql.MAX), "true")
        .query(`
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
          VALUES (@key, @value)
        `);
    } else {
      await pool.request()
        .input("key", sql.NVarChar(100), "ResultsPublished")
        .input("value", sql.NVarChar(sql.MAX), "true")
        .query(`
          UPDATE dbo.SystemSettings
          SET SettingValue = @value
          WHERE SettingKey = @key
        `);
    }

    const checkTimeResult = await pool.request().query(`
      SELECT COUNT(*) AS Count
      FROM dbo.SystemSettings
      WHERE SettingKey = 'ResultsPublishedAt'
    `);

    if (checkTimeResult.recordset[0].Count === 0) {
      await pool.request()
        .input("key", sql.NVarChar(100), "ResultsPublishedAt")
        .input("value", sql.NVarChar(sql.MAX), now)
        .query(`
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
          VALUES (@key, @value)
        `);
    } else {
      await pool.request()
        .input("key", sql.NVarChar(100), "ResultsPublishedAt")
        .input("value", sql.NVarChar(sql.MAX), now)
        .query(`
          UPDATE dbo.SystemSettings
          SET SettingValue = @value
          WHERE SettingKey = @key
        `);
    }

    res.json({ success: true, message: "Results published successfully" });

  } catch (err) {
    console.error("❌ Error publishing results:", err);
    res.status(500).json({ error: "Failed to publish results" });
  }
});

/* ====================================
   UNPUBLISH RESULTS
   ==================================== */
router.post("/unpublish-results", authenticateToken, isAdmin, async (req, res) => {
  try {
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) AS Count
      FROM dbo.SystemSettings
      WHERE SettingKey = 'ResultsPublished'
    `);

    if (checkResult.recordset[0].Count === 0) {
      await pool.request()
        .input("key", sql.NVarChar(100), "ResultsPublished")
        .input("value", sql.NVarChar(sql.MAX), "false")
        .query(`
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
          VALUES (@key, @value)
        `);
    } else {
      await pool.request()
        .input("key", sql.NVarChar(100), "ResultsPublished")
        .input("value", sql.NVarChar(sql.MAX), "false")
        .query(`
          UPDATE dbo.SystemSettings
          SET SettingValue = @value
          WHERE SettingKey = @key
        `);
    }

    res.json({ success: true, message: "Results unpublished successfully" });

  } catch (err) {
    console.error("❌ Error unpublishing results:", err);
    res.status(500).json({ error: "Failed to unpublish results" });
  }
});

/* ====================================
   DOWNLOAD CANDIDATE REPORT (CSV) - FIXED FOR YOUR SCHEMA
   ==================================== */
router.get("/report/candidates", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("=== Generating Candidate Report ===");

    // ✅ FIX: Only select columns that exist in YOUR Candidates table
    const result = await pool.request().query(`
      SELECT 
        c.CandidateId,
        c.Name,
        c.Position,
        c.Gender,
        COUNT(v.VoteId) AS VoteCount
      FROM dbo.Candidates c
      LEFT JOIN dbo.Votes v ON c.CandidateId = v.CandidateId
      GROUP BY c.CandidateId, c.Name, c.Position, c.Gender
      ORDER BY c.Position, VoteCount DESC
    `);

    console.log(`Found ${result.recordset.length} candidates`);

    // Build CSV
    const headers = ["CandidateId", "Name", "Position", "Gender", "VoteCount"];
    const rows = result.recordset.map((r) => [
      r.CandidateId,
      `"${(r.Name || "").replace(/"/g, '""')}"`,
      `"${(r.Position || "").replace(/"/g, '""')}"`,
      `"${(r.Gender || "").replace(/"/g, '""')}"`,
      r.VoteCount || 0
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    console.log("✅ CSV generated successfully");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=candidate_report.csv");
    res.send(csv);

  } catch (err) {
    console.error("❌ Candidate report error:", err);
    res.status(500).json({ error: "Failed to generate report", details: err.message });
  }
});

/* ====================================
   DOWNLOAD TURNOUT REPORT (CSV) - FIXED
   Replace ONLY this route in backend/routes/admin.js
   ==================================== */
router.get("/report/turnout", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("=== Generating Turnout Report ===");

    // ✅ FIXED: Removed 'Department' column - only use columns that exist in YOUR Voters table
    const result = await pool.request().query(`
      SELECT 
        v.VoterId,
        vt.FullName,
        vt.StudentId,
        vt.Gender,
        COUNT(v.VoteId) AS VotesCast,
        MIN(v.VotedAt) AS FirstVote,
        MAX(v.VotedAt) AS LastVote
      FROM dbo.Votes v
      INNER JOIN dbo.Voters vt ON v.VoterId = vt.VoterId
      GROUP BY v.VoterId, vt.FullName, vt.StudentId, vt.Gender
      ORDER BY vt.FullName
    `);

    console.log(`Found ${result.recordset.length} voters`);

    // Build CSV with proper date formatting
    const headers = ["VoterId", "FullName", "StudentId", "Gender", "VotesCast", "FirstVote", "LastVote"];
    
    const rows = result.recordset.map((r) => {
      const firstVote = r.FirstVote ? new Date(r.FirstVote).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }) : "";

      const lastVote = r.LastVote ? new Date(r.LastVote).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }) : "";

      return [
        r.VoterId,
        `"${(r.FullName || "").replace(/"/g, '""')}"`,
        `"${(r.StudentId || "").replace(/"/g, '""')}"`,
        `"${(r.Gender || "").replace(/"/g, '""')}"`,
        r.VotesCast || 0,
        `"${firstVote}"`,
        `"${lastVote}"`
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    console.log("✅ CSV generated successfully");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=turnout_report.csv");
    res.send(csv);

  } catch (err) {
    console.error("❌ Turnout report error:", err);
    res.status(500).json({ error: "Failed to generate report", details: err.message });
  }
});

module.exports = router;