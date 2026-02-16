// src/pages/DashboardHome.tsx - COMPLETE WITH RESULTS BANNER + FIXED DATES

import { useEffect, useState } from "react";
import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";
import everyVoteBanner from "@/assets/everyvote.png";
import voteBg from "@/assets/vote-bg.jpg";
import { Card } from "@/components/ui/card";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";

interface User {
  fullName?: string;
  email?: string;
  gender?: string;
  studentId?: string;
  role?: "admin" | "voter";
}

const announcementsData = [
  "🎤 Alice Johnson – Campus Development Meetup at Main Auditorium, 4:00 PM",
  "📢 Arvind – Student Welfare Discussion at Seminar Hall, 2:30 PM",
  "🎓 Brian – Academic Support Session at Room 204, 3:00 PM",
  "📢 Chitra Singh – Transparency Meet at Seminar Hall, 1:30 PM",
  "🏏 David Lee – Sports Upgrade Meet at DEF Ground, 4:30 PM",
  "🎨 Emma Rodriguez – Cultural Fest Planning at Auditorium, 5:00 PM",
  "💰 Farhan Khan – Budget Planning Meeting at Finance Office, 1:00 PM",
  "📚 Grace Chen – Library Extension Proposal at Conference Room, 3:30 PM",
  "🎭 Hassan Ali – Drama Club Initiative at Theatre, 6:00 PM",
  "🔬 Isabella Martinez – Science Lab Upgrade Discussion at Lab 3, 2:00 PM",
];

const DashboardHome = () => {
  const apiBase = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState<User | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [turnout, setTurnout] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(true);
  const [resultsPublishDate, setResultsPublishDate] = useState<string | null>(null); // ✅ NEW

  /* ================= Load User ================= */
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  /* ================= Election Countdown FROM DATABASE + RESULTS DATE ================= */
  useEffect(() => {
    const fetchElectionDate = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBase}/settings/system-dates`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          
          if (data.votingStart) {
            const today = new Date();
            const electionDate = new Date(data.votingStart);
            
            const diff = Math.ceil(
              (electionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            setDaysLeft(diff > 0 ? diff : 0);
          }

          // ✅ SET RESULTS PUBLISH DATE
          if (data.resultsPublish) {
            setResultsPublishDate(data.resultsPublish);
          }
        }
      } catch (err) {
        console.error("Failed to fetch election date:", err);
      }
    };

    fetchElectionDate();
  }, [apiBase]);

  /* ================= Vote Status ================= */
  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBase}/votes/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setHasVoted(data.hasVoted);
      } catch {}
      finally {
        setCheckingVoteStatus(false);
      }
    };

    checkVoteStatus();
  }, [apiBase]);

  /* ================= Turnout ================= */
  useEffect(() => {
    const fetchTurnout = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBase}/votes/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setTurnout(Math.min(data.turnoutPercent, 100));
      } catch {}
    };

    fetchTurnout();
  }, [apiBase]);

  /* ================= Download Slip - COMPLETELY FIXED ================= */
  const handleDownloadSlip = async () => {
    try {
      if (user?.role === "admin") return;

      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/votes/slip`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error("You have not voted yet.");
        return;
      }

      const data = await res.json();
      const doc = new jsPDF();
      
      // Generate verification ID
      const verificationId = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      // ✅ COLLEGE NAME AT TOP
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Anna Adarsh College Election", 105, 20, { align: "center" });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text("Official Voting Slip", 105, 30, { align: "center" });

      // Add separator line
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      // ✅ VOTER INFO
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Voter Name: ${data.voter || user?.fullName || "Unknown"}`, 20, 45);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Email: ${user?.email || "N/A"}`, 20, 52);
      doc.text(`Verification ID: ${verificationId}`, 20, 59);

      // Add separator
      doc.line(20, 65, 190, 65);

      // ✅ VOTES WITH PROPER DATE FORMATTING
      doc.setFont("helvetica", "bold");
      doc.text("Your Votes:", 20, 75);
      
      let y = 85;
      doc.setFont("helvetica", "normal");
      
      data.votes.forEach((vote: any, index: number) => {
        // Position and Candidate
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${vote.Position}`, 25, y);
        y += 7;
        
        doc.setFont("helvetica", "normal");
        doc.text(`   Candidate: ${vote.CandidateName}`, 25, y);
        y += 7;

        // ✅ FIXED DATE FORMATTING
        let formattedDate = "Date not available";
        try {
          if (vote.VotedAt) {
            const date = new Date(vote.VotedAt);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              });
            }
          }
        } catch (err) {
          console.error("Date formatting error:", err);
        }

        doc.text(`   Voted At: ${formattedDate}`, 25, y);
        y += 12;
      });

      // Watermark
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(50);
      doc.setFont("helvetica", "bold");
      doc.text("ANNA ADARSH", 60, 160, { angle: 45 });

      // Reset color for QR code section
      doc.setTextColor(0, 0, 0);

      // ✅ QR CODE with verification
      const qrData = `Anna Adarsh College Election
Voter: ${data.voter || user?.fullName}
Verification: ${verificationId}`;
      
      const qrImage = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
      });
      
      doc.addImage(qrImage, "PNG", 150, 25, 40, 40);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("This is an official voting slip. Keep it for your records.", 105, 280, { align: "center" });

      doc.save("Anna_Adarsh_Voting_Slip.pdf");
      toast.success("Voting slip downloaded successfully!");
    } catch (err) {
      console.error("Download slip error:", err);
      toast.error("Failed to download slip.");
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${voteBg})` }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>

      <div className="relative z-10 p-6 space-y-6 max-w-7xl mx-auto">

        {/* Election Countdown */}
        <div className="bg-blue-100 text-blue-800 py-3 rounded-xl text-center font-semibold shadow">
          🗳 Election starts in: {daysLeft} day(s)
        </div>

        {/* ✅ NEW: RESULTS PUBLISH BANNER */}
        {resultsPublishDate && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl text-center shadow-lg animate-pulse">
            <p className="text-lg font-bold flex items-center justify-center gap-2">
              <span className="text-2xl">🏆</span>
              Results will be published on{" "}
              <span className="font-extrabold underline">
                {new Date(resultsPublishDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </span>
            </p>
          </div>
        )}

        {/* Welcome Card */}
        <Card className="p-6 flex justify-between items-center shadow-lg rounded-xl">
          <div className="flex gap-4 items-center">
            <img
              src={user?.gender === "female" ? femaleAvatar : maleAvatar}
              className="w-20 h-20 rounded-full"
              alt="Avatar"
            />
            <div>
              <h2 className="text-3xl font-bold text-blue-700">
                Welcome {user?.fullName}
              </h2>
              <p>{user?.email}</p>
            </div>
          </div>

          <p className="text-blue-600 italic text-lg font-semibold">
            "Every voice matters — make yours count!"
          </p>
        </Card>

        {/* Status Row */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="p-4 shadow">
            <p className="font-semibold">Voting Status</p>
            {checkingVoteStatus ? (
              <p className="text-gray-500 font-bold">Checking...</p>
            ) : user?.role === "admin" ? (
              <p className="text-gray-500 font-bold">
                🚫 Not Applicable (Admin)
              </p>
            ) : hasVoted ? (
              <p className="text-green-600 font-bold">✅ Voted</p>
            ) : (
              <p className="text-orange-600 font-bold">⏳ Not Voted Yet</p>
            )}
          </Card>

          <Card className="p-4 shadow text-center">
            <p className="font-semibold">Download Voting Slip</p>
            <button
              onClick={handleDownloadSlip}
              disabled={!hasVoted || user?.role === "admin"}
              className={`mt-3 px-4 py-2 rounded transition-colors ${
                hasVoted && user?.role !== "admin"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {user?.role === "admin"
                ? "Not Available"
                : hasVoted
                ? "Download Slip"
                : "Vote First"}
            </button>
          </Card>

          <Card className="p-4 shadow">
            <p className="font-semibold">Live Turnout</p>
            <div className="w-full bg-gray-200 rounded h-3 mt-2">
              <div
                className="bg-green-500 h-3 rounded transition-all duration-500"
                style={{ width: `${turnout}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2">{turnout.toFixed(2)}% voted</p>
          </Card>
        </div>

        {/* Announcement + Banner */}
        <div className="grid grid-cols-2 gap-6">

          {/* SCROLLING ANNOUNCEMENTS */}
          <Card className="p-6 shadow-lg flex flex-col h-[450px]">
            <h3 className="text-purple-700 font-bold text-xl mb-4 flex-shrink-0">
              📢 Candidate Announcements
            </h3>

            <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-purple-50 to-white rounded-lg p-4">
              <div className="announcement-scroll-container">
                {announcementsData.map((announcement, index) => (
                  <div
                    key={`first-${index}`}
                    className="announcement-item"
                  >
                    {announcement}
                  </div>
                ))}
                {announcementsData.map((announcement, index) => (
                  <div
                    key={`second-${index}`}
                    className="announcement-item"
                  >
                    {announcement}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Banner */}
          <div className="h-[450px]">
            <img
              src={everyVoteBanner}
              className="rounded-xl shadow-lg object-cover h-full w-full"
              alt="Every Vote Counts"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardHome;