// src/pages/Login.tsx - ENHANCED MATCHING DARK AESTHETIC

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Vote, Eye, EyeOff, ArrowLeft, Lock, Mail } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (!data.token || !data.user) {
        toast.error("Invalid response from server");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Welcome back!");
      setLoading(false);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error("Unable to connect to server");
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Source+Sans+3:wght@300;400;500;600&display=swap');

        .login-root {
          min-height: 100vh;
          background: #0a0f1e;
          display: flex;
          font-family: 'Source Sans 3', sans-serif;
          color: #e8eaf0;
        }

        /* LEFT PANEL */
        .login-left {
          flex: 1;
          background: linear-gradient(145deg, #0d1529 0%, #0a1020 100%);
          padding: 48px 60px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -100px;
          left: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%);
          pointer-events: none;
        }

        .login-left::after {
          content: '';
          position: absolute;
          bottom: -80px;
          right: -80px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(79,70,229,0.12), transparent 70%);
          pointer-events: none;
        }

        .left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.4);
          font-size: 14px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          transition: color 0.2s;
          font-family: 'Source Sans 3', sans-serif;
          position: relative;
          z-index: 1;
        }
        .back-btn:hover { color: rgba(255,255,255,0.8); }

        .left-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .left-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .left-logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(37,99,235,0.4);
        }

        .left-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }

        .left-logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .left-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 3vw, 48px);
          font-weight: 900;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }

        .left-heading span {
          background: linear-gradient(135deg, #60a5fa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .left-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          margin-bottom: 48px;
          max-width: 380px;
          font-weight: 300;
        }

        /* FEATURE PILLS */
        .feature-pills {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pill {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 18px;
        }

        .pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .pill-text {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
        }

        /* RIGHT PANEL - FORM */
        .login-right {
          flex: 0 0 480px;
          background: #0f1525;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 52px;
        }

        .form-eyebrow {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #60a5fa;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
        }

        .form-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 36px;
        }

        .form-sub a {
          color: #60a5fa;
          cursor: pointer;
          text-decoration: none;
        }
        .form-sub a:hover { text-decoration: underline; }

        .field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .field-wrap {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          pointer-events: none;
        }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 13px 14px 13px 42px;
          font-size: 15px;
          color: #fff;
          font-family: 'Source Sans 3', sans-serif;
          transition: all 0.2s;
          outline: none;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus {
          border-color: rgba(37,99,235,0.6);
          background: rgba(37,99,235,0.07);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.25);
          cursor: pointer;
          padding: 0;
          display: flex;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.6); }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          font-family: 'Source Sans 3', sans-serif;
          margin-top: 8px;
          box-shadow: 0 8px 25px rgba(37,99,235,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(37,99,235,0.5);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 24px 0;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .divider-text { font-size: 12px; color: rgba(255,255,255,0.25); }

        .register-btn {
          width: 100%;
          padding: 13px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: rgba(255,255,255,0.6);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Source Sans 3', sans-serif;
        }
        .register-btn:hover {
          border-color: rgba(255,255,255,0.25);
          color: #fff;
          background: rgba(255,255,255,0.04);
        }

        .form-footer {
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.25);
        }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { flex: 1; padding: 40px 28px; }
        }
      `}</style>

      <div className="login-root">

        {/* LEFT PANEL */}
        <div className="login-left">
          <div className="left-grid" />

          <button className="back-btn" onClick={() => navigate("/")}>
            <ArrowLeft size={15} />
            Back to Home
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
              Democracy starts<br />
              with <span>your vote.</span>
            </h1>

            <p className="left-desc">
              Sign in to access the secure student election portal and make
              your voice count in the Anna Adarsh College elections.
            </p>

            <div className="feature-pills">
              {[
                { color: "#3b82f6", text: "Identity verified through Aadhaar KYC" },
                { color: "#8b5cf6", text: "One student, one vote — fully secure" },
                { color: "#10b981", text: "Download official voting slip after voting" },
              ].map((p, i) => (
                <div key={i} className="pill">
                  <div className="pill-dot" style={{ background: p.color }} />
                  <span className="pill-text">{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="login-right">
          <div className="form-eyebrow">Student Portal</div>
          <h2 className="form-title">Sign In</h2>
          <p className="form-sub">
            Don't have an account?{" "}
            <a onClick={() => navigate("/register")}>Register here</a>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <div className="field-wrap">
                <span className="field-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  className="field-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <span className="field-icon"><Lock size={16} /></span>
                <input
                  type={showPass ? "text" : "password"}
                  className="field-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <><div className="spinner" /> Signing in...</>
              ) : (
                "Sign In to Portal"
              )}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          <button className="register-btn" onClick={() => navigate("/register")}>
            Create a new account
          </button>

          <div className="form-footer">
            Secured by Anna Adarsh College Election Committee · 2026
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;