// backend/routes/settings.js - FIXED FOR YOUR DATABASE SCHEMA

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ✅ CORRECT IMPORT
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Import notification functions
const { 
  sendKycApprovalEmail, 
  sendKycApprovalSMS_MSG91,
  sendOtpSMS 
} = require("../utils/notifications");

// In-memory OTP storage for KYC (use Redis in production)
const kycOtpStore = new Map();

/* ====================================
   GET KYC STATUS (For Current User)
   ==================================== */
router.get("/kyc-status", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.voterId; // Using voterId from JWT

    const result = await pool.request()
      .input("voterId", voterId)
      .query(`
        SELECT 
          IsKycVerified,
          AadhaarNumber,
          PANNumber,
          ElectionId,
          KycVerifiedAt,
          Phone
        FROM dbo.Voters
        WHERE VoterId = @voterId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Voter profile not found" });
    }

    res.json(result.recordset[0]);

  } catch (err) {
    console.error("Error fetching KYC status:", err);
    res.status(500).json({ error: "Failed to fetch KYC status" });
  }
});

/* ====================================
   SEND OTP FOR KYC SUBMISSION
   ==================================== */
router.post("/kyc-send-otp", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.voterId;

    // Get user's phone number
    const userResult = await pool.request()
      .input("voterId", voterId)
      .query(`
        SELECT 
          Phone,
          FullName,
          IsKycVerified,
          AadhaarNumber
        FROM dbo.Voters
        WHERE VoterId = @voterId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "Voter profile not found" });
    }

    const voter = userResult.recordset[0];

    // Check if already verified
    if (voter.IsKycVerified) {
      return res.status(400).json({ error: "KYC already verified" });
    }

    // Check if already submitted (pending verification)
    if (voter.AadhaarNumber) {
      return res.status(400).json({ 
        error: "KYC documents already submitted. Waiting for admin approval." 
      });
    }

    if (!voter.Phone) {
      return res.status(400).json({ error: "Phone number not found in profile" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 minutes)
    const otpData = {
      otp: otp,
      voterId: voterId,
      phoneNumber: voter.Phone,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };

    kycOtpStore.set(voterId, otpData);

    // Send OTP via SMS
    const smsResult = await sendOtpSMS(voter.Phone, otp);

    if (smsResult.success || process.env.NODE_ENV === "development") {
      console.log(`✅ KYC OTP sent to ${voter.Phone}: ${otp}`);
      
      res.json({ 
        success: true, 
        message: "OTP sent successfully",
        maskedPhone: voter.Phone.slice(-4),
        // REMOVE THIS IN PRODUCTION
        otp: process.env.NODE_ENV === "development" ? otp : undefined
      });
    } else {
      res.status(500).json({ error: "Failed to send OTP" });
    }

  } catch (err) {
    console.error("Send KYC OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* ====================================
   RESEND OTP FOR KYC
   ==================================== */
router.post("/kyc-resend-otp", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.voterId;

    // Delete old OTP
    kycOtpStore.delete(voterId);

    // Get user's phone number
    const userResult = await pool.request()
      .input("voterId", voterId)
      .query("SELECT Phone FROM dbo.Voters WHERE VoterId = @voterId");

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "Voter profile not found" });
    }

    const phoneNumber = userResult.recordset[0].Phone;

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpData = {
      otp: otp,
      voterId: voterId,
      phoneNumber: phoneNumber,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };

    kycOtpStore.set(voterId, otpData);

    // Send OTP
    const smsResult = await sendOtpSMS(phoneNumber, otp);

    if (smsResult.success || process.env.NODE_ENV === "development") {
      console.log(`✅ KYC OTP resent to ${phoneNumber}: ${otp}`);
      
      res.json({ 
        success: true, 
        message: "OTP resent successfully",
        otp: process.env.NODE_ENV === "development" ? otp : undefined
      });
    } else {
      res.status(500).json({ error: "Failed to resend OTP" });
    }

  } catch (err) {
    console.error("Resend KYC OTP error:", err);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

/* ====================================
   VERIFY OTP AND SUBMIT KYC DOCUMENTS
   ==================================== */
router.post("/submit-kyc", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.voterId;
    const { aadhaarNumber, panNumber, electionId, otp } = req.body;

    // Validate required fields
    if (!aadhaarNumber || !otp) {
      return res.status(400).json({ error: "Aadhaar number and OTP are required" });
    }

    // Validate Aadhaar format
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return res.status(400).json({ error: "Invalid Aadhaar number" });
    }

    // Validate PAN if provided
    if (panNumber) {
      const cleanPAN = panNumber.toUpperCase().trim();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN)) {
        return res.status(400).json({ error: "Invalid PAN number format" });
      }
    }

    // Check if OTP exists
    const storedOtpData = kycOtpStore.get(voterId);

    if (!storedOtpData) {
      return res.status(400).json({ error: "OTP not found. Please request a new OTP." });
    }

    // Check if OTP expired
    if (Date.now() > storedOtpData.expiresAt) {
      kycOtpStore.delete(voterId);
      return res.status(400).json({ error: "OTP expired. Please request a new OTP." });
    }

    // Check attempts
    if (storedOtpData.attempts >= 3) {
      kycOtpStore.delete(voterId);
      return res.status(400).json({ 
        error: "Too many failed attempts. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      kycOtpStore.set(voterId, storedOtpData);
      
      return res.status(400).json({ 
        error: `Invalid OTP. ${3 - storedOtpData.attempts} attempts remaining.` 
      });
    }

    // OTP verified successfully - Update KYC documents

    // Check if Aadhaar already exists for another user
    const existingAadhaar = await pool.request()
      .input("aadhaar", cleanAadhaar)
      .input("voterId", voterId)
      .query(`
        SELECT VoterId 
        FROM dbo.Voters 
        WHERE AadhaarNumber = @aadhaar 
        AND VoterId != @voterId
      `);

    if (existingAadhaar.recordset.length > 0) {
      kycOtpStore.delete(voterId);
      return res.status(400).json({ 
        error: "This Aadhaar number is already registered with another account" 
      });
    }

    // Update voter's KYC documents
    await pool.request()
      .input("voterId", voterId)
      .input("aadhaar", cleanAadhaar)
      .input("pan", panNumber ? panNumber.toUpperCase() : null)
      .input("electionId", electionId ? electionId.toUpperCase() : null)
      .query(`
        UPDATE dbo.Voters 
        SET 
          AadhaarNumber = @aadhaar,
          PANNumber = @pan,
          ElectionId = @electionId,
          IsKycVerified = 0
        WHERE VoterId = @voterId
      `);

    // Delete OTP from store
    kycOtpStore.delete(voterId);

    console.log(`✅ KYC documents submitted for voter ${voterId}`);

    res.json({ 
      success: true, 
      message: "KYC documents submitted successfully. Waiting for admin approval." 
    });

  } catch (err) {
    console.error("Submit KYC error:", err);
    res.status(500).json({ error: "Failed to submit KYC documents" });
  }
});

/* ====================================
   GET PENDING KYC REQUESTS (Admin Only)
   ==================================== */
router.get("/admin/pending-kyc", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        VoterId,
        FullName,
        Email,
        AadhaarNumber,
        PANNumber,
        ElectionId,
        IsKycVerified,
        KycVerifiedAt
      FROM dbo.Voters
      WHERE IsKycVerified = 0 
      AND AadhaarNumber IS NOT NULL
      ORDER BY VoterId DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching pending KYC:", err);
    res.status(500).json({ error: "Failed to fetch pending KYC requests" });
  }
});

/* ====================================
   APPROVE KYC (Admin Only) - SENDS EMAIL TO USER
   ==================================== */
router.put("/admin/verify-kyc/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const voterId = req.params.id;

    // Get user details
    const userResult = await pool.request()
      .input("voterId", voterId)
      .query(`
        SELECT 
          FullName,
          Email,
          Phone
        FROM dbo.Voters
        WHERE VoterId = @voterId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "Voter not found" });
    }

    const user = userResult.recordset[0];

    // Update KYC status
    await pool.request()
      .input("voterId", voterId)
      .query(`
        UPDATE dbo.Voters 
        SET 
          IsKycVerified = 1,
          KycVerifiedAt = GETDATE()
        WHERE VoterId = @voterId
      `);

    // Send email to USER (not admin!)
    const emailResult = await sendKycApprovalEmail(user.Email, user.FullName);
    
    if (emailResult.success) {
      console.log(`✅ KYC approval email sent to ${user.Email}`);
    }

    // Send SMS
    if (user.Phone) {
      await sendKycApprovalSMS_MSG91(user.Phone, user.FullName);
    }

    res.json({ 
      success: true, 
      message: "KYC verified successfully",
      emailSent: emailResult.success,
      userEmail: user.Email
    });

  } catch (err) {
    console.error("KYC verification error:", err);
    res.status(500).json({ error: "Failed to verify KYC" });
  }
});

/* ====================================
   REJECT KYC (Admin Only)
   ==================================== */
router.put("/admin/reject-kyc/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const voterId = req.params.id;
    const { reason } = req.body;

    // Get user details
    const userResult = await pool.request()
      .input("voterId", voterId)
      .query(`
        SELECT 
          FullName,
          Email
        FROM dbo.Voters
        WHERE VoterId = @voterId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "Voter not found" });
    }

    const user = userResult.recordset[0];

    // Clear KYC documents (allow resubmission)
    await pool.request()
      .input("voterId", voterId)
      .query(`
        UPDATE dbo.Voters 
        SET 
          AadhaarNumber = NULL,
          PANNumber = NULL,
          ElectionId = NULL,
          IsKycVerified = 0
        WHERE VoterId = @voterId
      `);

    // Send rejection email
    await sendKycRejectionEmail(user.Email, user.FullName, reason);

    res.json({ 
      success: true, 
      message: "KYC rejected",
      userEmail: user.Email
    });

  } catch (err) {
    console.error("KYC rejection error:", err);
    res.status(500).json({ error: "Failed to reject KYC" });
  }
});

/* ====================================
   GET SYSTEM DATES
   ==================================== */
router.get("/system-dates", authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT TOP 1 
        VotingStartDate,
        VotingEndDate
      FROM dbo.ElectionSettings
      ORDER BY SettingId DESC
    `);

    if (result.recordset.length === 0) {
      return res.json({ votingStart: null, votingEnd: null });
    }

    res.json({
      votingStart: result.recordset[0].VotingStartDate,
      votingEnd: result.recordset[0].VotingEndDate,
    });
  } catch (err) {
    console.error("Error fetching system dates:", err);
    res.status(500).json({ error: "Failed to fetch dates" });
  }
});

// ADD THESE TWO ROUTES TO YOUR backend/routes/settings.js

/* ====================================
   UPDATE ELECTION DATES (Admin Only)
   ==================================== */
router.post("/update-dates", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { votingStart, votingEnd } = req.body;

    if (!votingStart || !votingEnd) {
      return res.status(400).json({ error: "Both dates are required" });
    }

    // Check if ElectionSettings table exists, create if not
    await pool.request().query(`
      IF OBJECT_ID('dbo.ElectionSettings', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.ElectionSettings (
          SettingId INT PRIMARY KEY IDENTITY(1,1),
          VotingStartDate DATETIME,
          VotingEndDate DATETIME,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END;
    `);

    // Clear old records and insert new dates
    await pool.request()
      .input("votingStart", votingStart)
      .input("votingEnd", votingEnd)
      .query(`
        DELETE FROM dbo.ElectionSettings;
        
        INSERT INTO dbo.ElectionSettings (VotingStartDate, VotingEndDate)
        VALUES (@votingStart, @votingEnd);
      `);

    console.log(`✅ Election dates updated: ${votingStart} to ${votingEnd}`);

    res.json({ 
      success: true, 
      message: "Election dates updated successfully" 
    });

  } catch (err) {
    console.error("Update dates error:", err);
    res.status(500).json({ error: "Failed to update election dates" });
  }
});

/* ====================================
   UPDATE VOTER PROFILE (Voter Only)
   ==================================== */
router.put("/update-profile", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.voterId;
    const { fullName, email, phone, gender } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !gender) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate phone format
    const cleanPhone = phone.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email or phone already exists for another user
    const duplicateCheck = await pool.request()
      .input("email", email)
      .input("phone", phone)
      .input("voterId", voterId)
      .query(`
        SELECT VoterId 
        FROM dbo.Voters 
        WHERE (Email = @email OR Phone = @phone) 
        AND VoterId != @voterId
      `);

    if (duplicateCheck.recordset.length > 0) {
      return res.status(400).json({ 
        error: "Email or phone number already in use by another account" 
      });
    }

    // Update profile
    await pool.request()
      .input("voterId", voterId)
      .input("fullName", fullName)
      .input("email", email)
      .input("phone", phone)
      .input("gender", gender)
      .query(`
        UPDATE dbo.Voters 
        SET 
          FullName = @fullName,
          Email = @email,
          Phone = @phone,
          Gender = @gender
        WHERE VoterId = @voterId
      `);

    console.log(`✅ Profile updated for voter ${voterId}`);

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      updatedData: { fullName, email, phone, gender }
    });

  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ADD THIS TO YOUR backend/routes/settings.js

/* ====================================
   UPDATE ELECTION DATES (Admin Only) - WITH RESULTS PUBLISH DATE
   ==================================== */
router.post("/update-dates", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { votingStart, votingEnd, resultsPublish } = req.body;

    if (!votingStart || !votingEnd) {
      return res.status(400).json({ error: "Voting dates are required" });
    }

    // Create table if doesn't exist
    await pool.request().query(`
      IF OBJECT_ID('dbo.ElectionSettings', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.ElectionSettings (
          SettingId INT PRIMARY KEY IDENTITY(1,1),
          VotingStartDate DATETIME,
          VotingEndDate DATETIME,
          ResultsPublishDate DATETIME NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END;
    `);

    // Clear old records and insert new dates
    await pool.request()
      .input("votingStart", votingStart)
      .input("votingEnd", votingEnd)
      .input("resultsPublish", resultsPublish || null)
      .query(`
        DELETE FROM dbo.ElectionSettings;
        
        INSERT INTO dbo.ElectionSettings (VotingStartDate, VotingEndDate, ResultsPublishDate)
        VALUES (@votingStart, @votingEnd, @resultsPublish);
      `);

    console.log(`✅ Election dates updated: ${votingStart} to ${votingEnd}, Results: ${resultsPublish || 'Not set'}`);

    res.json({ 
      success: true, 
      message: "Election dates updated successfully" 
    });

  } catch (err) {
    console.error("Update dates error:", err);
    res.status(500).json({ error: "Failed to update election dates" });
  }
});

/* ====================================
   GET SYSTEM DATES - WITH RESULTS PUBLISH DATE
   ==================================== */
router.get("/system-dates", authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT TOP 1 
        VotingStartDate,
        VotingEndDate,
        ResultsPublishDate
      FROM dbo.ElectionSettings
      ORDER BY SettingId DESC
    `);

    if (result.recordset.length === 0) {
      return res.json({ 
        votingStart: null, 
        votingEnd: null,
        resultsPublish: null 
      });
    }

    res.json({
      votingStart: result.recordset[0].VotingStartDate,
      votingEnd: result.recordset[0].VotingEndDate,
      resultsPublish: result.recordset[0].ResultsPublishDate, // ✅ NEW
    });
  } catch (err) {
    console.error("Error fetching system dates:", err);
    res.status(500).json({ error: "Failed to fetch dates" });
  }
});

/* ====================================
   HELPER: Send KYC Rejection Email
   ==================================== */
const sendKycRejectionEmail = async (to, voterName, reason) => {
  const nodemailer = require("nodemailer");
  
  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Anna Adarsh College" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "❌ KYC Verification Rejected - Anna Adarsh Election",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #dc2626; text-align: center;">KYC Verification Not Approved</h2>
        
        <p>Dear <strong>${voterName}</strong>,</p>
        
        <p>We regret to inform you that your identity verification (KYC) could not be approved at this time.</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0;"><strong>❌ Status:</strong> Rejected</p>
          <p style="margin: 10px 0 0 0;"><strong>📅 Date:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          <p style="margin: 10px 0 0 0;"><strong>📝 Reason:</strong> ${reason || "Documents did not meet verification requirements"}</p>
        </div>
        
        <p><strong>What to do next:</strong></p>
        <ul>
          <li>Log in to your account and go to Settings</li>
          <li>Resubmit your KYC documents with correct information</li>
          <li>Ensure documents are clear and match your registration details</li>
        </ul>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>Anna Adarsh College Election Committee</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send rejection email:`, error);
  }
};

module.exports = router;