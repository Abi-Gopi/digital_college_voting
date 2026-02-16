// src/pages/Dashboard.tsx
import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  BarChart,
  Settings,
  LogOut,
  MessageSquare,
  ClipboardList,
  Shield,
  FileCheck,
} from "lucide-react";

import DashboardHome from "./DashboardHome";
import Candidates from "./Candidates";
import Results from "./Results";
import Feedback from "./Feedback";
import SettingsPage from "./Settings";
import Vote from "./Vote";
import Admin from "./Admin";
import AdminFeedback from "./AdminFeedback";
import AdminKyc from "./AdminKyc";
import { toast } from "sonner";

type Role = "admin" | "voter";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [role, setRole] = useState<Role>("voter");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const r: Role = user.role === "admin" ? "admin" : "voter";
        setRole(r);
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <DashboardHome />;
      case "candidates":
        return <Candidates />;
      case "results":
        return <Results />;
      case "vote":
        return <Vote />;
      case "feedback":
        return <Feedback />;
      case "settings":
        return <SettingsPage />;
      case "admin":
        return <Admin />;
      case "admin-feedback":
        return <AdminFeedback />;
      case "admin-kyc":
        return <AdminKyc />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-blue-50 border-r border-blue-100 p-5 flex flex-col gap-3">
        <SidebarItem
          icon={<Home size={18} />}
          text="Home"
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
        />

        <SidebarItem
          icon={<Users size={18} />}
          text="Candidates"
          active={activeTab === "candidates"}
          onClick={() => setActiveTab("candidates")}
        />

        {role === "voter" && (
          <SidebarItem
            icon={<ClipboardList size={18} />}
            text="Vote"
            active={activeTab === "vote"}
            onClick={() => setActiveTab("vote")}
          />
        )}

        <SidebarItem
          icon={<BarChart size={18} />}
          text="Results"
          active={activeTab === "results"}
          onClick={() => setActiveTab("results")}
        />

        <SidebarItem
          icon={<MessageSquare size={18} />}
          text="Feedback"
          active={activeTab === "feedback"}
          onClick={() => setActiveTab("feedback")}
        />

        <SidebarItem
          icon={<Settings size={18} />}
          text="Settings"
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />

        {/* ADMIN SECTION */}
        {role === "admin" && (
          <>
            <div className="mt-4 text-xs text-blue-700 font-semibold uppercase">
              Admin
            </div>

            <SidebarItem
              icon={<Shield size={18} />}
              text="Admin Panel"
              active={activeTab === "admin"}
              onClick={() => setActiveTab("admin")}
            />

            <SidebarItem
              icon={<MessageSquare size={18} />}
              text="Feedback Management"
              active={activeTab === "admin-feedback"}
              onClick={() => setActiveTab("admin-feedback")}
            />

            <SidebarItem
              icon={<FileCheck size={18} />}
              text="KYC Verification"
              active={activeTab === "admin-kyc"}
              onClick={() => setActiveTab("admin-kyc")}
            />
          </>
        )}

        <div className="mt-auto">
          <SidebarItem
            icon={<LogOut size={18} />}
            text="Logout"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">{renderContent()}</div>
    </div>
  );
};

interface SidebarItemProps {
  icon: ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, text, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-all duration-150 ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-blue-700 hover:bg-blue-100"
      }`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </button>
  );
}

export default Dashboard;