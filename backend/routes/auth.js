// backend/routes/auth.js - FIXED: Login without KYC requirement
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { sendOtpSMS, sendWelcomeEmail } = require("../utils/notifications");

console.log("🔵 AUTH.JS FILE IS BEING LOADED");

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

/* ====================================
   SEND OTP FOR REGISTRATION
   ==================================== */
router.post("/send-otp", async (req, res) => {
  console.log("🎯 /send-otp endpoint HIT! Body:", req.body);
  try {
    const { phoneNumber, email } = req.body;

    if (!phoneNumber || !email) {
      return res.status(400).json({ error: "Phone number and email required" });
    }

    // Validate Indian phone number format
    const cleanPhone = phoneNumber.replace(/\s+/g, "").replace(/^\+91/, "");
    
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: "Invalid Indian phone number" });
    }

    // Check if phone number already registered
    const existingPhone = await pool.request()
      .input("phone", phoneNumber)
      .query("SELECT VoterId FROM dbo.Voters WHERE Phone = @phone");

    if (existingPhone.recordset.length > 0) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // Check if email already registered
    const existingEmail = await pool.request()
      .input("email", email)
      .query("SELECT VoterId FROM dbo.Voters WHERE Email = @email");

    if (existingEmail.recordset.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 minutes)
    const otpData = {
      otp: otp,
      phoneNumber: phoneNumber,
      email: email,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };

    otpStore.set(phoneNumber, otpData);

    // Send OTP via SMS
    const smsResult = await sendOtpSMS(phoneNumber, otp);

    if (smsResult.success) {
      console.log(`✅ OTP sent to ${phoneNumber}: ${otp}`);
      
      res.json({ 
        success: true, 
        message: "OTP sent successfully",
        otp: process.env.NODE_ENV === "development" ? otp : undefined
      });
    } else {
      console.error(`❌ Failed to send OTP to ${phoneNumber}`);
      
      if (process.env.NODE_ENV === "development") {
        console.log(`📱 DEVELOPMENT OTP for ${phoneNumber}: ${otp}`);
        
        res.json({ 
          success: true, 
          message: "OTP generated (check console)",
          otp: otp
        });
      } else {
        res.status(500).json({ error: "Failed to send OTP" });
      }
    }

  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* ====================================
   VERIFY OTP AND REGISTER USER
   ==================================== */
router.post("/verify-otp-and-register", async (req, res) => {
  try {
    const { 
      phoneNumber, 
      otp, 
      fullName, 
      studentId, 
      email, 
      gender, 
      password 
    } = req.body;

    if (!phoneNumber || !otp || !fullName || !studentId || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const storedOtpData = otpStore.get(phoneNumber);

    if (!storedOtpData) {
      return res.status(400).json({ error: "OTP not found. Please request a new OTP." });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ error: "OTP expired. Please request a new OTP." });
    }

    if (storedOtpData.attempts >= 3) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      otpStore.set(phoneNumber, storedOtpData);
      
      return res.status(400).json({ 
        error: `Invalid OTP. ${3 - storedOtpData.attempts} attempts remaining.` 
      });
    }

    const existingUser = await pool.request()
      .input("email", email)
      .input("studentId", studentId)
      .query(`
        SELECT VoterId, Email, StudentId 
        FROM dbo.Voters
        WHERE Email = @email OR StudentId = @studentId
      `);

    if (existingUser.recordset.length > 0) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ error: "Email or Student ID already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input("fullName", fullName)
      .input("email", email)
      .input("phone", phoneNumber)
      .input("gender", gender)
      .input("studentId", studentId)
      .input("password", hashedPassword)
      .query(`
        INSERT INTO dbo.Voters (
          FullName, 
          Email,
          Phone,
          Gender,
          StudentId, 
          PasswordHash,
          IsVerified,
          IsKycVerified, 
          CreatedAt
        )
        VALUES (
          @fullName, 
          @email,
          @phone,
          @gender,
          @studentId, 
          @password,
          0,
          0, 
          GETDATE()
        )
      `);

    otpStore.delete(phoneNumber);
    await sendWelcomeEmail(email, fullName);

    console.log(`✅ User registered successfully: ${email}`);

    res.json({ 
      success: true, 
      message: "Registration successful! You can now login." 
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

/* ====================================
   RESEND OTP
   ==================================== */
router.post("/resend-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number required" });
    }

    otpStore.delete(phoneNumber);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpData = {
      otp: otp,
      phoneNumber: phoneNumber,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };

    otpStore.set(phoneNumber, otpData);

    const smsResult = await sendOtpSMS(phoneNumber, otp);

    if (smsResult.success || process.env.NODE_ENV === "development") {
      console.log(`✅ OTP resent to ${phoneNumber}: ${otp}`);
      
      res.json({ 
        success: true, 
        message: "OTP resent successfully",
        otp: process.env.NODE_ENV === "development" ? otp : undefined
      });
    } else {
      res.status(500).json({ error: "Failed to resend OTP" });
    }

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

/* ====================================
   LOGIN - FIXED: No KYC requirement to login
   Users can login immediately after registration
   KYC verification happens later when they submit documents
   ==================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check if this is admin login (admin emails typically contain "admin")
    const isAdminEmail = email.toLowerCase() === "admin@demo.com" || 
                         email.toLowerCase().includes("admin");

    // Get user from Voters table
    const voterResult = await pool.request()
      .input("email", email)
      .query("SELECT * FROM dbo.Voters WHERE Email = @email");

    if (voterResult.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const voter = voterResult.recordset[0];

    if (!voter.PasswordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, voter.PasswordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Determine role (admin vs voter)
    const role = isAdminEmail ? "admin" : "voter";

    // Generate JWT token (NO KYC check here!)
    const token = jwt.sign(
      { 
        voterId: voter.VoterId, 
        role: role,
        email: voter.Email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        voterId: voter.VoterId,
        email: voter.Email,
        role: role,
        fullName: voter.FullName,
        gender: voter.Gender,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;