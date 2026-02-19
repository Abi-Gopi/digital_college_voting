// src/pages/Index.tsx - ENHANCED LANDING PAGE

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Vote, Shield, Users, BarChart3, ChevronRight, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
    setTimeout(() => setMounted(true), 50);
  }, [navigate]);

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }} className="min-h-screen overflow-x-hidden" >

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Source+Sans+3:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        .landing-root {
          font-family: 'Source Sans 3', sans-serif;
          background: #0a0f1e;
          color: #e8eaf0;
          min-height: 100vh;
        }

        /* ── ANIMATED BACKGROUND ── */
        .bg-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(37,99,235,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%),
            #0a0f1e;
        }

        .grid-overlay {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* ── HEADER ── */
        .header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 60px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,15,30,0.7);
          backdrop-filter: blur(12px);
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(37,99,235,0.4);
        }

        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
        }

        .logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: -2px;
        }

        .nav-btns {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
          padding: 9px 22px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Source Sans 3', sans-serif;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.3);
          color: #fff;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border: none;
          color: #ffffff;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Source Sans 3', sans-serif;
          box-shadow: 0 4px 15px rgba(37,99,235,0.35);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.5);
        }

        /* ── HERO ── */
        .hero {
          position: relative;
          z-index: 1;
          padding: 100px 60px 80px;
          display: flex;
          align-items: center;
          gap: 80px;
          max-width: 1300px;
          margin: 0 auto;
        }

        .hero-left {
          flex: 1;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '30px'});
          transition: all 0.8s cubic-bezier(0.16,1,0.3,1);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(37,99,235,0.15);
          border: 1px solid rgba(37,99,235,0.3);
          color: #93c5fd;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(42px, 5vw, 68px);
          font-weight: 900;
          line-height: 1.1;
          color: #ffffff;
          margin: 0 0 24px 0;
          letter-spacing: -1px;
        }

        .hero-title span {
          background: linear-gradient(135deg, #60a5fa, #818cf8, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 17px;
          color: rgba(255,255,255,0.55);
          line-height: 1.7;
          margin: 0 0 40px 0;
          max-width: 480px;
          font-weight: 300;
        }

        .hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .cta-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: #fff;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.25s;
          font-family: 'Source Sans 3', sans-serif;
          box-shadow: 0 8px 25px rgba(37,99,235,0.4);
        }
        .cta-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(37,99,235,0.55);
        }

        .cta-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: rgba(255,255,255,0.7);
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.25s;
          font-family: 'Source Sans 3', sans-serif;
        }
        .cta-outline:hover {
          border-color: rgba(255,255,255,0.35);
          color: #fff;
          background: rgba(255,255,255,0.05);
        }

        .hero-trust {
          margin-top: 36px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }

        /* ── HERO VISUAL ── */
        .hero-right {
          flex: 0 0 420px;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '30px'});
          transition: all 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s;
        }

        .vote-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 60px rgba(0,0,0,0.4);
        }

        .vote-card-header {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 20px;
          letter-spacing: 0.3px;
        }

        .candidate-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
          cursor: default;
        }

        .candidate-row.selected {
          background: rgba(37,99,235,0.15);
          border-color: rgba(37,99,235,0.4);
        }

        .candidate-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .candidate-info { flex: 1; }
        .candidate-name { font-size: 14px; font-weight: 600; color: #fff; }
        .candidate-pos { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }

        .vote-bar-wrap { flex: 0 0 80px; }
        .vote-bar-track {
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
          overflow: hidden;
        }
        .vote-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 1s ease 0.5s;
        }
        .vote-pct { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 5px; text-align: right; }

        .vote-card-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #34d399;
          font-weight: 600;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          background: #34d399;
          border-radius: 50%;
          animation: pulse-dot 1.5s infinite;
        }

        /* ── STATS BAR ── */
        .stats-bar {
          position: relative;
          z-index: 1;
          max-width: 1300px;
          margin: 0 auto 0;
          padding: 0 60px 60px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .stat-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 16px;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '20px'});
          transition: all 0.7s cubic-bezier(0.16,1,0.3,1);
        }

        .stat-box:nth-child(1) { transition-delay: 0.2s; }
        .stat-box:nth-child(2) { transition-delay: 0.3s; }
        .stat-box:nth-child(3) { transition-delay: 0.4s; }

        .stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }

        .stat-label {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin-top: 4px;
        }

        /* ── FEATURES ── */
        .features-section {
          position: relative;
          z-index: 1;
          padding: 60px;
          max-width: 1300px;
          margin: 0 auto;
        }

        .section-label {
          text-align: center;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #60a5fa;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          margin: 0 0 50px 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 32px;
          transition: all 0.3s;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '20px'});
        }

        .feature-card:nth-child(1) { transition: all 0.7s ease 0.3s; }
        .feature-card:nth-child(2) { transition: all 0.7s ease 0.4s; }
        .feature-card:nth-child(3) { transition: all 0.7s ease 0.5s; }

        .feature-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }

        .feat-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .feat-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
        }

        .feat-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
        }

        /* ── CTA SECTION ── */
        .cta-section {
          position: relative;
          z-index: 1;
          margin: 0 60px 60px;
          background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(79,70,229,0.2));
          border: 1px solid rgba(37,99,235,0.25);
          border-radius: 24px;
          padding: 60px;
          text-align: center;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(37,99,235,0.2), transparent 70%);
          pointer-events: none;
        }

        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 14px;
        }

        .cta-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 36px;
        }

        /* ── FOOTER ── */
        .footer {
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 24px 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-left {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
        }

        .footer-right {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
        }

        @media (max-width: 900px) {
          .header { padding: 16px 24px; }
          .hero { flex-direction: column; padding: 60px 24px 40px; gap: 40px; }
          .hero-right { flex: unset; width: 100%; }
          .stats-bar { padding: 0 24px 40px; grid-template-columns: 1fr; }
          .features-section { padding: 40px 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .cta-section { margin: 0 24px 40px; padding: 40px 24px; }
          .footer { padding: 20px 24px; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <div className="landing-root">
        <div className="bg-layer" />
        <div className="grid-overlay" />

        {/* HEADER */}
        <header className="header">
          <div className="logo-area">
            <div className="logo-icon">
              <Vote size={20} color="#fff" />
            </div>
            <div>
              <div className="logo-text">Anna Adarsh College</div>
              <div className="logo-sub">Digital Election Portal</div>
            </div>
          </div>
          <div className="nav-btns">
            <button className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
            <button className="btn-primary" onClick={() => navigate("/register")}>Register →</button>
          </div>
        </header>

        {/* HERO */}
        <main>
          <div className="hero">
            <div className="hero-left">
              <div className="hero-badge">
                <div className="badge-dot" />
                Student Elections 2026
              </div>

              <h1 className="hero-title">
                Your Voice.<br />
                <span>Your Vote.</span><br />
                Your Future.
              </h1>

              <p className="hero-sub">
                Participate in the Anna Adarsh College Student Elections through our
                secure, transparent, and fully digital voting platform.
              </p>

              <div className="hero-ctas">
                <button className="cta-main" onClick={() => navigate("/register")}>
                  Cast Your Vote <ChevronRight size={18} />
                </button>
                <button className="cta-outline" onClick={() => navigate("/results")}>
                  View Live Results
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <CheckCircle size={14} color="#34d399" />
                  OTP Verified
                </div>
                <div className="trust-item">
                  <CheckCircle size={14} color="#34d399" />
                  KYC Secured
                </div>
                <div className="trust-item">
                  <CheckCircle size={14} color="#34d399" />
                  Anonymous Voting
                </div>
              </div>
            </div>

            {/* VISUAL VOTE CARD */}
            <div className="hero-right">
              <div className="vote-card">
                <div className="vote-card-header">🗳 Student Council Election 2026</div>

                {[
                  { name: "Arvind Kumar", pos: "President", pct: 42, color: "#3b82f6", selected: true, letter: "A" },
                  { name: "Chitra Singh", pos: "Secretary", pct: 31, color: "#8b5cf6", selected: false, letter: "C" },
                  { name: "David Lee", pos: "Treasurer", pct: 27, color: "#10b981", selected: false, letter: "D" },
                ].map((c, i) => (
                  <div key={i} className={`candidate-row ${c.selected ? "selected" : ""}`}>
                    <div className="candidate-avatar" style={{ background: c.color }}>
                      {c.letter}
                    </div>
                    <div className="candidate-info">
                      <div className="candidate-name">{c.name}</div>
                      <div className="candidate-pos">{c.pos}</div>
                    </div>
                    <div className="vote-bar-wrap">
                      <div className="vote-bar-track">
                        <div
                          className="vote-bar-fill"
                          style={{ width: mounted ? `${c.pct}%` : '0%', background: c.color }}
                        />
                      </div>
                      <div className="vote-pct">{c.pct}%</div>
                    </div>
                  </div>
                ))}

                <div className="vote-card-footer">
                  <div className="live-badge">
                    <div className="live-dot" />
                    Live Results
                  </div>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>85 votes cast</span>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="stats-bar">
            {[
              { icon: <Users size={22} color="#60a5fa" />, bg: "rgba(37,99,235,0.15)", num: "3", label: "Registered Voters" },
              { icon: <Vote size={22} color="#a78bfa" />, bg: "rgba(79,70,229,0.15)", num: "33", label: "Candidates Running" },
              { icon: <BarChart3 size={22} color="#34d399" />, bg: "rgba(16,185,129,0.15)", num: "6", label: "Election Positions" },
            ].map((s, i) => (
              <div key={i} className="stat-box">
                <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                <div>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FEATURES */}
          <div className="features-section">
            <div className="section-label">Why Choose Us</div>
            <h2 className="section-title">Built for Trust & Transparency</h2>

            <div className="features-grid">
              {[
                {
                  icon: <Shield size={26} color="#60a5fa" />,
                  bg: "rgba(37,99,235,0.15)",
                  title: "Secure & Verified",
                  desc: "Every voter is identity-verified through Aadhaar KYC and OTP authentication, ensuring each student votes only once."
                },
                {
                  icon: <Users size={26} color="#a78bfa" />,
                  bg: "rgba(79,70,229,0.15)",
                  title: "Easy to Use",
                  desc: "An intuitive, mobile-friendly interface ensures every student can cast their vote in under 2 minutes, regardless of technical expertise."
                },
                {
                  icon: <BarChart3 size={26} color="#34d399" />,
                  bg: "rgba(16,185,129,0.15)",
                  title: "Real-time Results",
                  desc: "Watch live vote tallies update instantly. Results are published officially by the admin with full transparency and downloadable voting slips."
                },
              ].map((f, i) => (
                <div key={i} className="feature-card">
                  <div className="feat-icon-wrap" style={{ background: f.bg }}>{f.icon}</div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA SECTION */}
          <div className="cta-section">
            <h2 className="cta-title">Ready to Make Your Voice Heard?</h2>
            <p className="cta-sub">Register with your student credentials and cast your vote securely.</p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="cta-main" onClick={() => navigate("/register")}>
                Register Now <ChevronRight size={18} />
              </button>
              <button className="cta-outline" onClick={() => navigate("/login")}>
                Already registered? Login
              </button>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-left">
            © {new Date().getFullYear()} Anna Adarsh College — Student Election Committee
          </div>
          <div className="footer-right">
            Secure · Transparent · Democratic
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;