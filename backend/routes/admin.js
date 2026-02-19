// routes/admin.js - COMPLETE VERSION with safe dynamic turnout report

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const sql = require("mssql");

const { authenticateToken, isAdmin } = require("../middleware/auth");

/* ====================================
   Helper: ensure SystemSettings exists
   ==================================== */
async function ensureSystemSettingsTable() {
  await pool.request().query(`
    IF OBJECT_ID('dbo.SystemSettings', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SystemSettings (
        SettingKey   NVARCHAR(100) NOT NULL PRIMARY KEY,
        SettingValue NVARCHAR(4000) NULL
      );
      INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
      VALUES ('ResultsPublished', 'false'),
             ('ResultsPublishedAt', NULL);
    END;
  `);
}

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
   (accessible to all logged-in users)
   ==================================== */
router.get("/results-status", authenticateToken, async (req, res) => {
  try {
    await ensureSystemSettingsTable();

    const result = await pool.request().query(`
      SELECT
        MAX(CASE WHEN SettingKey = 'ResultsPublished'   THEN SettingValue END) AS ResultsPublished,
        MAX(CASE WHEN SettingKey = 'ResultsPublishedAt' THEN SettingValue END) AS ResultsPublishedAt
      FROM dbo.SystemSettings;
    `);

    const row = result.recordset[0] || {};
    const published = (row.ResultsPublished || "").toLowerCase() === "true";
    const publishedAt = row.ResultsPublishedAt || null;

    res.json({ published, publishedAt });

  } catch (err) {
    console.error("❌ Results status error:", err);
    res.status(500).json({ error: "Failed to fetch results status" });
  }
});

/* ====================================
   PUBLISH RESULTS
   ==================================== */
router.post("/publish-results", authenticateToken, isAdmin, async (req, res) => {
  try {
    await ensureSystemSettingsTable();

    const now = new Date().toISOString();

    await pool.request()
      .input("value", sql.NVarChar(sql.MAX), "true")
      .query(`
        IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = 'ResultsPublished')
          UPDATE dbo.SystemSettings SET SettingValue = @value WHERE SettingKey = 'ResultsPublished';
        ELSE
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue) VALUES ('ResultsPublished', @value);
      `);

    await pool.request()
      .input("value", sql.NVarChar(sql.MAX), now)
      .query(`
        IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = 'ResultsPublishedAt')
          UPDATE dbo.SystemSettings SET SettingValue = @value WHERE SettingKey = 'ResultsPublishedAt';
        ELSE
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue) VALUES ('ResultsPublishedAt', @value);
      `);

    const io = req.app.get("io");
    if (io) {
      io.emit("notification", {
        type: "results_published",
        title: "Election Results Published",
        message: "The Admin has officially published the election results. Please check the Results tab.",
        publishedAt: now,
      });
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
    await ensureSystemSettingsTable();

    await pool.request()
      .input("value", sql.NVarChar(sql.MAX), "false")
      .query(`
        IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = 'ResultsPublished')
          UPDATE dbo.SystemSettings SET SettingValue = @value WHERE SettingKey = 'ResultsPublished';
        ELSE
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue) VALUES ('ResultsPublished', @value);
      `);

    await pool.request().query(`
      UPDATE dbo.SystemSettings SET SettingValue = NULL WHERE SettingKey = 'ResultsPublishedAt';
    `);

    const io = req.app.get("io");
    if (io) {
      io.emit("notification", {
        type: "results_unpublished",
        title: "Results Hidden",
        message: "The Admin has hidden the election results.",
      });
    }

    res.json({ success: true, message: "Results unpublished successfully" });

  } catch (err) {
    console.error("❌ Error unpublishing results:", err);
    res.status(500).json({ error: "Failed to unpublish results" });
  }
});

/* ====================================
   DOWNLOAD CANDIDATE REPORT (CSV)
   ==================================== */
router.get("/report/candidates", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("=== Generating Candidate Report ===");

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

    const headers = ["CandidateId", "Name", "Position", "Gender", "VoteCount"];
    const rows = result.recordset.map((r) => [
      r.CandidateId,
      `"${(r.Name     || "").replace(/"/g, '""')}"`,
      `"${(r.Position || "").replace(/"/g, '""')}"`,
      `"${(r.Gender   || "").replace(/"/g, '""')}"`,
      r.VoteCount || 0,
    ]);

    const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=candidate_report.csv");
    res.send(csv);

  } catch (err) {
    console.error("❌ Candidate report error:", err);
    res.status(500).json({ error: "Failed to generate report", details: err.message });
  }
});

/* ====================================
   DEBUG: Show Voters table columns
   (remove this route after confirming column names)
   ==================================== */
router.get("/debug-voters", authenticateToken, isAdmin, async (req, res) => {
  try {
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Voters' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `);
    const sampleResult = await pool.request().query(`SELECT TOP 1 * FROM dbo.Voters`);
    res.json({
      columns: columnsResult.recordset,
      sample: sampleResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ====================================
   DOWNLOAD TURNOUT REPORT (CSV)
   Step 1: reads actual column names from INFORMATION_SCHEMA
   Step 2: builds query string dynamically — SQL Server only
           compiles what we actually send, so no "Invalid column" errors
   ==================================== */
router.get("/report/turnout", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("=== Generating Turnout Report ===");

    // Step 1 — find out which columns actually exist in dbo.Voters
    const colCheck = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME   = 'Voters'
        AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `);

    const existingCols  = colCheck.recordset.map((r) => r.COLUMN_NAME);
    console.log("dbo.Voters columns:", existingCols);

    const has = (col) => existingCols.includes(col);

    // Step 2 — build SELECT / GROUP BY / ORDER BY as plain strings
    //          Only reference columns confirmed to exist
    const selectCols  = ["v.VoterId"];
    const groupCols   = ["v.VoterId"];
    const csvHeaders  = ["VoterId"];

    // Always-present candidate columns — add only if found
    for (const col of ["FullName", "Email", "StudentId", "Department", "Year", "Batch", "Course", "Phone"]) {
      if (has(col)) {
        selectCols.push(`vt.${col}`);
        groupCols.push(`vt.${col}`);
        csvHeaders.push(col);
      }
    }

    selectCols.push("COUNT(v.VoteId) AS VotesCast");
    selectCols.push("MIN(v.VotedAt)  AS FirstVote");
    selectCols.push("MAX(v.VotedAt)  AS LastVote");
    csvHeaders.push("VotesCast", "FirstVote", "LastVote");

    const orderBy = has("FullName") ? "vt.FullName" : "v.VoterId";

    const query = `
      SELECT ${selectCols.join(", ")}
      FROM dbo.Votes v
      INNER JOIN dbo.Voters vt ON v.VoterId = vt.VoterId
      GROUP BY ${groupCols.join(", ")}
      ORDER BY ${orderBy}
    `;

    console.log("Running query:", query);
    const result = await pool.request().query(query);
    console.log(`Found ${result.recordset.length} voters who voted`);

    // Step 3 — build CSV rows dynamically using the same column list
    const fmt = (dt) => dt
      ? new Date(dt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })
      : "";

    const dataRows = result.recordset.map((r) => {
      const row = [r.VoterId];

      for (const col of ["FullName", "Email", "StudentId", "Department", "Year", "Batch", "Course", "Phone"]) {
        if (has(col)) row.push(`"${(r[col] || "").toString().replace(/"/g, '""')}"`);
      }

      row.push(r.VotesCast || 0);
      row.push(`"${fmt(r.FirstVote)}"`);
      row.push(`"${fmt(r.LastVote)}"`);
      return row;
    });

    const csv = [csvHeaders.join(","), ...dataRows.map((row) => row.join(","))].join("\n");

    console.log("✅ Turnout CSV generated successfully");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=turnout_report.csv");
    res.send(csv);

  } catch (err) {
    console.error("❌ Turnout report error:", err);
    res.status(500).json({ error: "Failed to generate report", details: err.message });
  }
});

module.exports = router;