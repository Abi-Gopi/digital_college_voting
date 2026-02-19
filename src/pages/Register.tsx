// src/pages/Register.tsx - FIXED: Prevents triple submission bug

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Vote, ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff,
  ShieldCheck, CheckCircle, ChevronRight, Loader2
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // 🔧 FIX: Prevent multiple submissions
  const isSubmitting = useRef(false);

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phoneNumber: "",
    gender: "male",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  /* ================= VALIDATION ================= */
  const validatePhoneNumber = (phone: string) => {
    const clean = phone.replace(/\s+/g, "").replace(/^\+91/, "");
    return /^[6-9]\d{9}$/.test(clean);
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    if (!formData.fullName.trim()) { toast.error("Full name is required"); return false; }
    if (!formData.studentId.trim()) { toast.error("Student ID is required"); return false; }
    if (!validateEmail(formData.email)) { toast.error("Please enter a valid email address"); return false; }
    if (!validatePhoneNumber(formData.phoneNumber)) { toast.error("Please enter a valid 10-digit Indian mobile number"); return false; }
    if (formData.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return false; }
    return true;
  };

  /* ================= OTP DIGIT INPUT ================= */
  const handleOtpDigit = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);
    setOtp(newDigits.join(""));
    if (val && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  /* ================= SEND OTP ================= */
  const handleSendOtp = async () => {
    // 🔧 Prevent multiple calls
    if (isSubmitting.current) {
      console.log("⚠️ Already sending OTP, ignoring duplicate call");
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      isSubmitting.current = true;
      setLoading(true);
      
      console.log("📤 Sending OTP request...");
      
      const res = await fetch(`${apiBase}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: formData.phoneNumber, 
          email: formData.email 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) { 
        toast.error(data.error || "Failed to send OTP"); 
        return; 
      }
      
      toast.success("OTP sent to your mobile number!");
      setStep(2);
      startCountdown();
      
      if (data.otp) {
        toast.info(`Development OTP: ${data.otp}`, { duration: 10000 });
        console.log("📱 [DEV] OTP:", data.otp);
      }
      
    } catch (err: any) {
      console.error("❌ Send OTP error:", err);
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
      // Reset after 1 second to prevent accidental double-clicks
      setTimeout(() => {
        isSubmitting.current = false;
      }, 1000);
    }
  };

  /* ================= RESEND OTP ================= */
  const handleResendOtp = async () => {
    // 🔧 Prevent multiple calls
    if (isSubmitting.current) {
      console.log("⚠️ Already resending OTP, ignoring duplicate call");
      return;
    }
    
    try {
      isSubmitting.current = true;
      setLoading(true);
      
      const res = await fetch(`${apiBase}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formData.phoneNumber }),
      });
      
      const data = await res.json();
      
      if (!res.ok) { 
        toast.error(data.error || "Failed to resend OTP"); 
        return; 
      }
      
      toast.success("OTP resent successfully!");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtp("");
      startCountdown();
      
      if (data.otp) {
        toast.info(`Development OTP: ${data.otp}`, { duration: 10000 });
        console.log("📱 [DEV] OTP:", data.otp);
      }
      
    } catch (err: any) {
      console.error("❌ Resend OTP error:", err);
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
      setTimeout(() => {
        isSubmitting.current = false;
      }, 1000);
    }
  };

  /* ================= VERIFY & REGISTER ================= */
  const handleVerifyAndRegister = async () => {
    // 🔧 CRITICAL FIX: Prevent multiple submissions
    if (isSubmitting.current) {
      console.log("⚠️ Already submitting registration, ignoring duplicate call");
      return;
    }
    
    if (otp.length !== 6) { 
      toast.error("Please enter the complete 6-digit OTP"); 
      return; 
    }
    
    try {
      isSubmitting.current = true;
      setLoading(true);
      
      console.log("📤 Submitting registration...");
      console.log("📋 Data:", {
        fullName: formData.fullName,
        studentId: formData.studentId,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        otp: otp
      });
      
      const res = await fetch(`${apiBase}/auth/verify-otp-and-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          otp 
        }),
      });
      
      const data = await res.json();
      
      console.log("📥 Response:", data);
      
      if (!res.ok) { 
        console.error("❌ Registration failed:", data.error);
        toast.error(data.error || "Registration failed"); 
        return; 
      }
      
      console.log("✅ Registration successful!");
      toast.success("Registration successful!");
      
      setStep(3);
      setTimeout(() => navigate("/login"), 3000);
      
    } catch (err: any) {
      console.error("❌ Registration error:", err);
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
      // Don't reset isSubmitting here - let the success/error state persist
      // Only reset on page reload or manual retry
    }
  };

  /* ================= RENDER ================= */
  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Source+Sans+3:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        .reg-root {
          min-height: 100vh;
          background: #0a0f1e;
          display: flex;
          font-family: 'Source Sans 3', sans-serif;
          color: #e8eaf0;
        }

        /* LEFT PANEL */
        .reg-left {
          flex: 1;
          background: linear-gradient(145deg, #0d1529 0%, #0a1020 100%);
          padding: 48px 60px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .reg-left::before {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%);
          pointer-events: none;
        }

        .reg-left::after {
          content: '';
          position: absolute;
          bottom: -80px; right: -60px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%);
          pointer-events: none;
        }

        .left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.4); font-size: 14px;
          cursor: pointer; background: none; border: none; padding: 0;
          transition: color 0.2s;
          font-family: 'Source Sans 3', sans-serif;
          position: relative; z-index: 1;
        }
        .back-btn:hover { color: rgba(255,255,255,0.8); }

        .left-content {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; position: relative; z-index: 1;
        }

        .left-logo {
          display: flex; align-items: center; gap: 12px; margin-bottom: 44px;
        }

        .left-logo-icon {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 24px rgba(37,99,235,0.4);
        }

        .left-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700; color: #fff;
        }

        .left-logo-sub {
          font-size: 11px; color: rgba(255,255,255,0.35);
          letter-spacing: 2px; text-transform: uppercase;
        }

        .left-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3vw, 44px);
          font-weight: 900; color: #fff;
          line-height: 1.15; margin-bottom: 16px; letter-spacing: -0.5px;
        }

        .left-heading span {
          background: linear-gradient(135deg, #34d399, #60a5fa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .left-desc {
          font-size: 15px; color: rgba(255,255,255,0.45);
          line-height: 1.7; margin-bottom: 40px; max-width: 380px;
          font-weight: 300;
        }

        /* STEPS VISUAL */
        .steps-list { display: flex; flex-direction: column; gap: 0; }

        .step-item {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 0 0 24px 0; position: relative;
        }

        .step-item:not(:last-child)::after {
          content: '';
          position: absolute; left: 15px; top: 34px;
          width: 2px; bottom: 0;
          background: rgba(255,255,255,0.08);
        }

        .step-num {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
          position: relative; z-index: 1;
        }

        .step-num.active {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: #fff;
          box-shadow: 0 0 16px rgba(37,99,235,0.5);
        }

        .step-num.done {
          background: rgba(16,185,129,0.2);
          border: 1px solid rgba(16,185,129,0.4);
          color: #34d399;
        }

        .step-num.pending {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.3);
        }

        .step-text-title {
          font-size: 14px; font-weight: 600;
          color: rgba(255,255,255,0.85); margin-bottom: 3px;
        }

        .step-text-sub {
          font-size: 12px; color: rgba(255,255,255,0.35); line-height: 1.5;
        }

        /* RIGHT PANEL */
        .reg-right {
          flex: 0 0 520px;
          background: #0f1525;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 48px 52px;
          overflow-y: auto;
        }

        .form-eyebrow {
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          color: #60a5fa; font-weight: 600; margin-bottom: 8px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 6px;
        }

        .form-sub {
          font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 28px;
        }

        .form-sub a {
          color: #60a5fa; cursor: pointer; text-decoration: none;
        }
        .form-sub a:hover { text-decoration: underline; }

        /* FORM GRID */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-grid .full { grid-column: 1 / -1; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }

        .field-label {
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.45);
          letter-spacing: 1px; text-transform: uppercase;
        }

        .field-wrap { position: relative; }

        .field-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.22); pointer-events: none;
        }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 11px 13px 11px 40px;
          font-size: 14px; color: #fff;
          font-family: 'Source Sans 3', sans-serif;
          transition: all 0.2s; outline: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.18); }
        .field-input:focus {
          border-color: rgba(37,99,235,0.55);
          background: rgba(37,99,235,0.07);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }

        .field-select {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 11px 13px 11px 40px;
          font-size: 14px; color: #fff;
          font-family: 'Source Sans 3', sans-serif;
          transition: all 0.2s; outline: none;
          appearance: none; cursor: pointer;
        }
        .field-select:focus {
          border-color: rgba(37,99,235,0.55);
          background: rgba(37,99,235,0.07);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .field-select option { background: #1e2a45; color: #fff; }

        .field-hint {
          font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 3px;
        }

        .eye-btn {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255,255,255,0.22); cursor: pointer;
          display: flex; transition: color 0.2s;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.6); }

        /* SUBMIT BUTTON */
        .submit-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border: none; border-radius: 10px;
          color: #fff; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.25s;
          font-family: 'Source Sans 3', sans-serif;
          margin-top: 6px;
          box-shadow: 0 8px 25px rgba(37,99,235,0.35);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(37,99,235,0.5);
        }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* OTP INPUTS */
        .otp-phone-info {
          background: rgba(37,99,235,0.1);
          border: 1px solid rgba(37,99,235,0.25);
          border-radius: 10px; padding: 14px 16px;
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px;
        }

        .otp-phone-text { font-size: 14px; color: rgba(255,255,255,0.6); }
        .otp-phone-num { color: #93c5fd; font-weight: 600; }

        .otp-boxes {
          display: flex; gap: 10px; justify-content: center;
          margin-bottom: 8px;
        }

        .otp-box {
          width: 50px; height: 56px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          text-align: center; font-size: 22px; font-weight: 700;
          color: #fff; outline: none;
          font-family: 'Source Sans 3', sans-serif;
          transition: all 0.2s;
          caret-color: #3b82f6;
        }
        .otp-box:focus {
          border-color: rgba(37,99,235,0.6);
          background: rgba(37,99,235,0.1);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        }
        .otp-box.filled {
          border-color: rgba(16,185,129,0.5);
          background: rgba(16,185,129,0.07);
        }

        .otp-resend {
          text-align: center; font-size: 13px;
          color: rgba(255,255,255,0.3); margin: 16px 0;
        }

        .otp-resend-btn {
          color: #60a5fa; background: none; border: none;
          cursor: pointer; font-size: 13px;
          font-family: 'Source Sans 3', sans-serif;
        }
        .otp-resend-btn:hover { text-decoration: underline; }

        .back-link {
          text-align: center; margin-top: 12px;
        }
        .back-link button {
          background: none; border: none; cursor: pointer;
          font-size: 13px; color: rgba(255,255,255,0.3);
          font-family: 'Source Sans 3', sans-serif; transition: color 0.2s;
        }
        .back-link button:hover { color: rgba(255,255,255,0.7); }

        /* SUCCESS STATE */
        .success-wrap {
          display: flex; flex-direction: column;
          align-items: center; text-align: center; padding: 20px 0;
        }

        .success-icon {
          width: 80px; height: 80px;
          background: rgba(16,185,129,0.15);
          border: 2px solid rgba(16,185,129,0.4);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
          animation: success-pop 0.5s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes success-pop {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .success-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 10px;
        }

        .success-sub {
          font-size: 15px; color: rgba(255,255,255,0.4);
          line-height: 1.7; max-width: 320px; margin-bottom: 28px;
        }

        .success-redirect {
          font-size: 13px; color: rgba(255,255,255,0.25);
          margin-top: 12px;
        }

        /* PROGRESS BAR */
        .progress-bar {
          display: flex; gap: 6px; margin-bottom: 28px;
        }

        .progress-seg {
          flex: 1; height: 3px; border-radius: 99px;
          background: rgba(255,255,255,0.08);
          transition: background 0.4s;
        }
        .progress-seg.done { background: #2563eb; }
        .progress-seg.active { background: rgba(37,99,235,0.5); }

        @media (max-width: 900px) {
          .reg-left { display: none; }
          .reg-right { flex: 1; padding: 40px 24px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .full { grid-column: 1; }
        }
      `}</style>

      <div className="reg-root">

        {/* LEFT PANEL */}
        <div className="reg-left">
          <div className="left-grid" />

          <button className="back-btn" onClick={() => navigate("/")}>
            <ArrowLeft size={15} /> Back to Home
          </button>

          <div className="left-content">
            <div className="left-logo">
              <div className="left-logo-icon">
                <Vote size={22} color="#fff" />
              </div>
              <div>
                <div className="left-logo-name">Anna Adarsh College</div>
                <div className="left-logo-sub">Election Portal 2026</div>
              </div>
            </div>

            <h1 className="left-heading">
              Join the<br />
              <span>democratic process.</span>
            </h1>

            <p className="left-desc">
              Create your verified student account in just a few steps and become 
              an eligible voter for the Anna Adarsh College Student Elections.
            </p>

            {/* STEPS */}
            <div className="steps-list">
              {[
                { label: "Personal Details", sub: "Fill in your student info & credentials", num: 1 },
                { label: "Phone Verification", sub: "Verify your mobile number via OTP", num: 2 },
                { label: "You're Registered!", sub: "Submit KYC to activate voting rights", num: 3 },
              ].map((s) => (
                <div key={s.num} className="step-item">
                  <div className={`step-num ${step > s.num ? "done" : step === s.num ? "active" : "pending"}`}>
                    {step > s.num ? <CheckCircle size={15} /> : s.num}
                  </div>
                  <div>
                    <div className="step-text-title">{s.label}</div>
                    <div className="step-text-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="reg-right">

          {/* PROGRESS */}
          <div className="progress-bar">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`progress-seg ${step > n ? "done" : step === n ? "active" : ""}`}
              />
            ))}
          </div>

          {/* ── STEP 1: FORM ── */}
          {step === 1 && (
            <>
              <div className="form-eyebrow">Step 1 of 2</div>
              <h2 className="form-title">Create Account</h2>
              <p className="form-sub">
                Already registered?{" "}
                <a onClick={() => navigate("/login")}>Sign in here</a>
              </p>

              <div className="form-grid">
                {/* Full Name */}
                <div className="field-group full">
                  <label className="field-label">Full Name</label>
                  <div className="field-wrap">
                    <span className="field-icon"><User size={15} /></span>
                    <input
                      className="field-input"
                      placeholder="e.g. Thara Priya"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Student ID */}
                <div className="field-group">
                  <label className="field-label">Student ID</label>
                  <div className="field-wrap">
                    <span className="field-icon"><ShieldCheck size={15} /></span>
                    <input
                      className="field-input"
                      placeholder="STU12345"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="field-group">
                  <label className="field-label">Gender</label>
                  <div className="field-wrap">
                    <span className="field-icon"><User size={15} /></span>
                    <select
                      className="field-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div className="field-group full">
                  <label className="field-label">Email Address</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Mail size={15} /></span>
                    <input
                      type="email"
                      className="field-input"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="field-group full">
                  <label className="field-label">Phone Number</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Phone size={15} /></span>
                    <input
                      className="field-input"
                      placeholder="9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <p className="field-hint">10-digit Indian mobile number — OTP will be sent here</p>
                </div>

                {/* Password */}
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Lock size={15} /></span>
                    <input
                      type={showPass ? "text" : "password"}
                      className="field-input"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="field-group">
                  <label className="field-label">Confirm Password</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Lock size={15} /></span>
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="field-input"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="submit-btn"
                onClick={handleSendOtp}
                disabled={loading}
                style={{ marginTop: "20px" }}
              >
                {loading ? (
                  <><div className="spinner" /> Sending OTP...</>
                ) : (
                  <>Send OTP <ChevronRight size={16} /></>
                )}
              </button>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <>
              <div className="form-eyebrow">Step 2 of 2</div>
              <h2 className="form-title">Verify Your Phone</h2>
              <p className="form-sub" style={{ marginBottom: "24px" }}>
                Enter the 6-digit code sent to your mobile
              </p>

              <div className="otp-phone-info">
                <Phone size={16} color="#93c5fd" />
                <span className="otp-phone-text">
                  Code sent to <span className="otp-phone-num">{formData.phoneNumber}</span>
                </span>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label className="field-label" style={{ display: "block", marginBottom: "14px", textAlign: "center" }}>
                  Enter OTP
                </label>
                <div className="otp-boxes">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      className={`otp-box ${d ? "filled" : ""}`}
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpDigit(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      inputMode="numeric"
                    />
                  ))}
                </div>
              </div>

              <div className="otp-resend">
                {countdown > 0 ? (
                  <>Resend code in <strong style={{ color: "rgba(255,255,255,0.5)" }}>{countdown}s</strong></>
                ) : (
                  <button className="otp-resend-btn" onClick={handleResendOtp} disabled={loading}>
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                className="submit-btn"
                onClick={handleVerifyAndRegister}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <><div className="spinner" /> Verifying...</>
                ) : (
                  <>Complete Registration <ChevronRight size={16} /></>
                )}
              </button>

              <div className="back-link">
                <button onClick={() => { setStep(1); isSubmitting.current = false; }}>← Edit my details</button>
              </div>
            </>
          )}

          {/* ── STEP 3: SUCCESS ── */}
          {step === 3 && (
            <div className="success-wrap">
              <div className="success-icon">
                <CheckCircle size={38} color="#34d399" />
              </div>
              <h2 className="success-title">Registration Successful!</h2>
              <p className="success-sub">
                Your account has been created. Please complete your KYC verification 
                in Settings to activate your voting rights.
              </p>
              <button
                className="submit-btn"
                style={{ maxWidth: "280px" }}
                onClick={() => navigate("/login")}
              >
                Go to Login <ChevronRight size={16} />
              </button>
              <p className="success-redirect">Redirecting automatically in 3 seconds...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;